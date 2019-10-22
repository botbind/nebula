import Discord from 'discord.js';
import Command from './Command';
import Addon from './Addon';
import Monitor, { OptionalMonitorOptions } from './Monitor';
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
   * The history of the commands being dispatched for a message
   */
  public commandHistory: Discord.Collection<string, Command[]>;

  /**
   * Invoked when the command name doesn't resolve to any commands
   */
  protected async didResolveCommandsUnsuccessfully(
    message: Discord.Message,
    name: string,
    parent?: string,
  ) {
    message.channel.send(
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

    this.commandHistory = new Discord.Collection();
  }

  /**
   * Dispatch commands based on messages.
   * @param message The created message
   */
  public async didDispatch(message: Discord.Message) {
    const [commandPrefix, commandName, commandArgs] = this.parseCommand(message.content);

    if (commandPrefix !== this.addon.client.options.prefix) return;

    // We allow multiple commands to be ran at the same time
    const commands = this.addon.store.commands.filter(
      command => command.name === commandName || command.alias.includes(commandName),
    );

    if (commands.length === 0) {
      if (this.didResolveCommandsUnsuccessfully)
        this.didResolveCommandsUnsuccessfully(message, commandName);

      return;
    }

    if (this.addon.client.options.typing) message.channel.startTyping();

    this.deletePrevResponse(message);

    this.commandHistory.set(message.id, commands);

    commands.forEach(command => {
      command.responses.set(message.id, []);

      // eslint-disable-next-line no-param-reassign
      command.message = message;

      this._dispatchCommandsRecursively(command, message, commandArgs);
    });

    if (this.addon.client.options.typing) message.channel.stopTyping();
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: Discord.Message,
    args: string[],
  ) {
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
      if (command.willDispatch) command.willDispatch();

      const shouldDispatch = await command.composeInhibitors();

      if (!shouldDispatch) return;

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
            errors.reduce(
              (res, [key, result]) => {
                res[key] = result;

                return res;
              },
              {} as ValidationErrors,
            ),
          );

          return;
        }

        validatedArgs = results as ValidationResults;
      }

      if (command.didDispatch == null) {
        return;
      }

      let isSuccessfullyDispatched = true;
      try {
        const dispatchResult = await command.didDispatch(validatedArgs);

        if (dispatchResult instanceof Error || (dispatchResult !== undefined && !dispatchResult))
          isSuccessfullyDispatched = false;
      } catch (err) {
        isSuccessfullyDispatched = false;
      }

      if (!isSuccessfullyDispatched) {
        if (command.didDispatchUnsuccessfully) command.didDispatchUnsuccessfully(validatedArgs);
      } else if (command.didDispatchSuccessfully) command.didDispatchSuccessfully(validatedArgs);
    }
  }

  /**
   * Delete the responses of the previous command
   */
  public deletePrevResponse(message: Discord.Message) {
    const prevCommands = this.commandHistory.get(message.id);

    if (prevCommands) {
      prevCommands.forEach(command => {
        const responses = command.responses.get(message.id)!;

        responses
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter(response => !(response as any).deleted)
          .forEach(response => response.delete());

        command.responses.set(message.id, []);
      });
    }
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
