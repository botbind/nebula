import Discord from 'discord.js';
import Command from './Command';
import Addon from './Addon';
import Monitor, { OptionalMonitorOptions } from './Monitor';
import CommandMessage from './CommandMessage';
/**
 * The components of a commands, including 3 parts: prefix, name and arguments
 */
export type CommandComponents = [string, string, string[]];

export default class Dispatcher extends Monitor {
  private _commandMessages: Discord.Collection<string, CommandMessage>;

  /**
   * The dispatcher of all Nebula commands
   * @param addon The addon of this dispatcher
   */
  constructor(addon: Addon, options: OptionalMonitorOptions = {}) {
    super(addon, options);

    this._commandMessages = new Discord.Collection();
  }

  /**
   * Delete all responses of a message
   * @param message The created message
   */
  public deleteResponses(message: Discord.Message) {
    const commandMessage = this._commandMessages.get(message.id);

    if (!commandMessage) return;

    commandMessage.deleteResponses();
    this._commandMessages.delete(message.id);
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: CommandMessage,
    args: string[],
  ) {
    if (command.subcommands.length) {
      const [subcommandName, ...rest] = args;

      if (subcommandName == null) {
        if (command.options.subcommands.defaultToFirst) {
          this._dispatchCommandsRecursively(command.subcommands[0], message, rest);
          return;
        }

        await this.didResolveCommandsUnsuccessfully(message, '', command.name);

        message.reset();
        return;
      }

      const subcommands = command.subcommands.filter(
        subcommand =>
          subcommand.name === subcommandName || subcommand.alias.includes(subcommandName),
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
   * @param message The Nebula message wrapper
   * @param name The name of the command
   * @param parent The name of the parent command
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
   * Dispatch commands based on messages
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

    let commandMessage = this._commandMessages.get(message.id);

    if (commandMessage == null) {
      commandMessage = new CommandMessage(message);

      this._commandMessages.set(message.id, commandMessage);
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
