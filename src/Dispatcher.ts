import Discord from 'discord.js';
import Command from './Command';
import Addon from './Addon';
import Util from './Util';
import NebulaError from './NebulaError';
import { ValidationResults, ValidationErrors } from './Validator';
import ValidationError from './Validator/ValidationError';

/**
 * The components of a commands, including 3 parts: prefix, name and arguments
 */
export type CommandComponents = [string, string, string[]];

export default class Dispatcher {
  /**
   * The addon of this dispatcher
   */
  protected addon: Addon;

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
  constructor(addon: Addon) {
    this.addon = addon;
  }

  /**
   * Dispatch commands based on messages.
   * @param message The created message
   */
  public async dispatch(message: Discord.Message) {
    const [commandPrefix, commandName, commandArgs] = this.parseCommand(message.content);

    if (commandPrefix !== this.addon.client.options.prefix || message.author.bot) return;

    // We allow multiple commands to be ran at the same time
    const commands = this.addon.store.filter(
      ({ category, resource }) =>
        category === 'commands' &&
        (resource.name === commandName || resource.alias.includes(commandName)),
    );

    if (!commands.length) {
      if (this.didResolveCommandsUnsuccessfully)
        this.didResolveCommandsUnsuccessfully(message, commandName);
      return;
    }

    if (this.addon.client.options.typing) message.channel.startTyping();

    for (const { resource } of commands)
      this._dispatchCommandsRecursively(resource, message, commandArgs);

    if (this.addon.client.options.typing) message.channel.stopTyping();
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: Discord.Message,
    args: string[],
  ) {
    if (command.instantiatedSubcommands.length) {
      const [subcommandName, ...rest] = args;

      if (!subcommandName) {
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

      if (!subcommand) {
        this.didResolveCommandsUnsuccessfully(message, subcommandName, command.name);
        return;
      }

      this._dispatchCommandsRecursively(subcommand, message, rest);
    } else {
      if (command.willDispatch) command.willDispatch(message);

      const shouldDispatch = await command.composeInhibitors(message);

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
            message,
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

      if (!command.didDispatch) return;

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
          command.didDispatchUnsuccessfully(message, validatedArgs);
        return;
      }

      if (command.didDispatchSuccessfully) command.didDispatchSuccessfully(message, validatedArgs);
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
