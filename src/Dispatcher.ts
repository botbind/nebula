import Command from './Command';
import Addon from './Addon';
import Monitor, { OptionalMonitorOptions } from './Monitor';
import Message from './Message';
import Util from './Util';
import NebulaError from './NebulaError';
import { ValidationResults, ValidationErrors } from './Validator';
import ValidationError from './ValidationError';

/**
 * The components of a commands, including 3 parts: prefix, name and arguments
 */
export type CommandComponents = [string, string, string[]];

export default class Dispatcher extends Monitor {
  /**
   * Invoked when the command name doesn't resolve to any commands
   */
  protected async didResolveCommandsUnsuccessfully(
    message: Message,
    name: string,
    parent?: string,
  ) {
    message.send(
      `Cannot find command "${name}" from ${this.addon.name} ${
        parent ? `of parent ${parent}` : ''
      }`,
    );
  }

  /**
   * The dispatcher of all Nebula commands
   * @param addon The addon of this dispatcher
   */
  constructor(addon: Addon, options: OptionalMonitorOptions = {}) {
    super(addon, options);
  }

  /**
   * Dispatch commands based on messages.
   * @param message The created message
   */
  public async didDispatch(message: Message) {
    const [commandPrefix, commandName, commandArgs] = this.parseCommand(message.content);

    if (commandPrefix !== this.addon.client.options.prefix) return;

    // We allow multiple commands to be ran at the same time
    const commands = this.addon.store.commands.filter(({ resource }) => {
      const command = resource as Command;

      return command.name === commandName || command.alias.includes(commandName);
    });

    if (commands.length === 0) {
      if (this.didResolveCommandsUnsuccessfully)
        this.didResolveCommandsUnsuccessfully(message, commandName);
      return;
    }

    if (this.addon.client.options.typing) message.channel.startTyping();

    commands.forEach(({ resource }) => {
      const command = resource as Command;

      this._dispatchCommandsRecursively(command, message, commandArgs);
    });

    if (this.addon.client.options.typing) message.channel.stopTyping();
  }

  private async _dispatchCommandsRecursively(command: Command, message: Message, args: string[]) {
    if (command.instantiatedSubcommands.length) {
      const [subcommandName, ...rest] = args;

      if (subcommandName == null) {
        if (command.options.subcommands.defaultToFirst) {
          const defaultSubcommand = command.instantiatedSubcommands[0];

          if (defaultSubcommand.options.schema)
            throw new NebulaError('Default subcommands must not have schema');

          this._dispatchCommandsRecursively(defaultSubcommand, message, rest);
          return;
        }

        this.didResolveCommandsUnsuccessfully(message, '', command.name);
        return;
      }

      const subcommand = command.instantiatedSubcommands.find(
        instantiatedSubcommand =>
          instantiatedSubcommand.name === subcommandName ||
          instantiatedSubcommand.alias.includes(subcommandName),
      );

      if (subcommand == null) {
        this.didResolveCommandsUnsuccessfully(message, subcommandName, command.name);
        return;
      }

      this._dispatchCommandsRecursively(subcommand, message, rest);
    } else {
      // Initial arps collection
      // Stop indicator of the arp must be set to false here since instead of inside the message,
      // due to the async nature of message.send()
      const responseCollection = this.addon.client.arp.get(message.id);
      if (!responseCollection) this.addon.client.arp.set(message.id, [false, []]);

      if (command.willDispatch) command.willDispatch(message);

      const shouldDispatch = await command.composeInhibitors(message);

      if (!shouldDispatch) {
        // Whenever the function returns, stop collection immediately
        this._stopArpCollection(message);
        return;
      }

      let validatedArgs;

      if (command.options.schema) {
        if (!Util.isObject(command.options.schema))
          throw new NebulaError(
            `The validation schema for command ${command.name} must be an object with validators`,
          );

        const results = this.addon.validator.validate(message, args, command.options.schema);
        const errors = Util.entriesOf(results).filter(([, result]) => Util.isArray(result)) as [
          string,
          ValidationError[],
        ][];

        if (errors.length) {
          command.didCatchValidationErrors(
            message,
            errors.reduce(
              (res, [key, result]) => {
                res[key] = result;

                return res;
              },
              {} as ValidationErrors,
            ),
          );

          this._stopArpCollection(message);
          return;
        }

        validatedArgs = results as ValidationResults;
      }

      if (command.didDispatch == null) {
        this._stopArpCollection(message);
        return;
      }

      let isSuccessfullyDispatched = true;
      try {
        const dispatchResult = await command.didDispatch(message, validatedArgs);

        if (dispatchResult instanceof Error || (dispatchResult !== undefined && !dispatchResult))
          isSuccessfullyDispatched = false;
      } catch (err) {
        isSuccessfullyDispatched = false;
      }

      if (!isSuccessfullyDispatched) {
        if (command.didDispatchUnsuccessfully)
          await command.didDispatchUnsuccessfully(message, validatedArgs);
      } else if (command.didDispatchSuccessfully)
        await command.didDispatchSuccessfully(message, validatedArgs);

      this._stopArpCollection(message);
    }
  }

  private _stopArpCollection(message: Message) {
    const [, responses] = this.addon.client.arp.get(message.id)!;

    this.addon.client.arp.set(message.id, [true, responses]);
  }

  /**
   * Parse a message content and return the command prefix, name and arguments
   * @param content The message content
   */
  public parseCommand(content: string): CommandComponents {
    const [commandName, ...commandArgs] = content
      .substring(1, content.length)
      .trim()
      .split(/ +/g);

    return [content.substring(0, 1), commandName, commandArgs];
  }
}
