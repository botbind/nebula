import Discord from 'discord.js';
import Command from './Command';
import Addon from './Addon';
import Util from './Util';
import NebulaError from './NebulaError';
import { ValidationResults } from './Validator';

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
  didResolveCommandsUnsuccessfully(message: Discord.Message, name: string, parent?: string) {
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
  async dispatch(message: Discord.Message, commandComponents: CommandComponents) {
    const [, commandName, commandArgs] = commandComponents;

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

    for (const { resource } of commands)
      this._dispatchCommandsRecursively(resource, message, commandArgs);
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: Discord.Message,
    args: string[],
  ) {
    if (command.instantiatedSubcommands.length) {
      const [subcommandName, ...rest] = args;

      if (!subcommandName && command.options.subcommands.defaultToFirst) {
        const defaultSubcommand = command.instantiatedSubcommands[0];

        if (defaultSubcommand.options.schema)
          throw new Error('Default subcommands must not have schema');

        this._dispatchCommandsRecursively(command.instantiatedSubcommands[0], message, rest);

        return;
      }

      const subcommand = command.instantiatedSubcommands.find(
        command => command.name === subcommandName || command.alias.includes(subcommandName),
      );

      if (!subcommand) {
        this.didResolveCommandsUnsuccessfully(message, subcommandName || '', command.name);

        return;
      }

      this._dispatchCommandsRecursively(subcommand, message, rest);
    } else {
      let willDispatch;

      if (command.willDispatch) willDispatch = await command.willDispatch(message);

      if (willDispatch !== undefined && !willDispatch) return;

      if (command.shouldCooldown(message)) {
        command.didCooldown(message);

        return;
      }

      if (command.shouldInhibitNSFW(message)) {
        command.didInhibitNSFW(message);

        return;
      }

      let validatedArgs;

      if (command.options.schema) {
        if (!Util.isObject(command.options.schema))
          throw new NebulaError('schema must be an object with validators');

        const results = this.addon.validator.validate(message, args, command.options.schema);

        const errors = Util.entriesOf(results).filter(([, results]) => Util.isArray(results));

        if (errors.length) {
          command.didCatchValidationErrors(
            message,
            errors.reduce(
              (res, [key, result]) => {
                res[key] = result;

                return res;
              },
              {} as ValidationResults,
            ),
          );

          return;
        }

        validatedArgs = results;
      }

      if (!command.didDispatch) return;

      const isSuccessfullyDispatched = await command.didDispatch(message, validatedArgs);

      if (isSuccessfullyDispatched !== undefined && !isSuccessfullyDispatched) {
        if (command.didDispatchUnsuccessfully) command.didDispatchUnsuccessfully(message);

        return;
      }

      if (command.didDispatchSuccessfully) command.didDispatchSuccessfully(message);
    }
  }

  /**
   * Parse a message content and return the command prefix, name and arguments
   * @param content The message content
   */
  parseCommand(content: string): CommandComponents {
    const [commandName, ...commandArgs] = content
      .substring(1, content.length)
      .trim()
      .split(/ +/g);

    return [content.substring(0, 1), commandName, commandArgs];
  }
}