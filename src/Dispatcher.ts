import Discord from 'discord.js';
import Command from './Command';
import Addon from './Addon';
import Monitor, { OptionalMonitorOptions } from './Monitor';
import CommandMessage from './CommandMessage';
import NebulaError from './NebulaError';

/**
 * The components of a commands, including 3 parts: prefix, name and arguments
 */
export type CommandComponents = [string, string, string[]];

export default class Dispatcher extends Monitor {
  private _messages: Discord.Collection<string, CommandMessage>;

  /**
   * The dispatcher of all Nebula commands
   * @param addon The addon of this dispatcher
   */
  constructor(addon: Addon, options: OptionalMonitorOptions = {}) {
    super(addon, options);

    this._messages = new Discord.Collection();
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: CommandMessage,
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

        await this.didResolveCommandsUnsuccessfully(message, '', command.name);

        message.reset();
        return;
      }

      const subcommands = command.instantiatedSubcommands.filter(
        instantiatedSubcommand =>
          instantiatedSubcommand.name === subcommandName ||
          instantiatedSubcommand.alias.includes(subcommandName),
      );

      if (subcommands.length === 0) {
        await this.didResolveCommandsUnsuccessfully(message, subcommandName, command.name);

        message.reset();
        return;
      }

      subcommands.forEach(subcommand => {
        this._dispatchCommandsRecursively(subcommand, message, rest);
      });
    } else {
      await command.callLifecycles(message, args);

      message.reset();
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

  /**
   * Invoked when the command name doesn't resolve to any commands
   */
  protected async didResolveCommandsUnsuccessfully(
    message: CommandMessage,
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
   * Dispatch commands based on messages.
   * @param message The created message
   */
  public async didDispatch(message: Discord.Message) {
    const [commandPrefix, commandName, commandArgs] = this.parseCommand(message.content);

    if (commandPrefix !== this.addon.client.options.prefix) return;

    if (this.addon.client.options.typing) message.channel.startTyping();

    // We allow multiple commands to be ran at the same time
    const commands = this.addon.store.commands.filter(
      command => command.name === commandName || command.alias.includes(commandName),
    );

    let commandMessage = this._messages.get(message.id);

    if (commandMessage == null) {
      commandMessage = new CommandMessage(message);

      this._messages.set(message.id, commandMessage);
    }

    if (commands.length === 0) {
      if (this.didResolveCommandsUnsuccessfully) {
        await this.didResolveCommandsUnsuccessfully(commandMessage, commandName);

        commandMessage.reset();
      }

      return;
    }

    commands.forEach(command => {
      this._dispatchCommandsRecursively(command, commandMessage!, commandArgs);
    });

    if (this.addon.client.options.typing) message.channel.stopTyping(true);
  }
}
