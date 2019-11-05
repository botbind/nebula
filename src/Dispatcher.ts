import Discord, { Message } from 'discord.js';
import Command from './Command';
import Addon from './Addon';
import Monitor, { OptionalMonitorOptions } from './Monitor';
import CommandMessage from './CommandMessage';

export default class Dispatcher extends Monitor {
  private _commandMessages: Discord.Collection<string, CommandMessage>;

  private _sweepInterval: NodeJS.Timeout | null;

  /**
   * The dispatcher of all Nebula commands
   * @param addon The addon of this dispatcher
   */
  constructor(addon: Addon, options: OptionalMonitorOptions = {}) {
    super(addon, 'nebula-dispatcher', 'nebula-ignore', options);

    this._commandMessages = new Discord.Collection();
    this._sweepInterval = null;
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: CommandMessage,
    args: string[],
  ) {
    if (command.subcommands.length) {
      const [subcommandName, ...rest] = args;

      // If the user doesn't provide the subcommand name
      if (subcommandName == null) {
        if (command.options.subcommands.defaultToFirst) {
          this._dispatchCommandsRecursively(command.subcommands[0], message, rest);
          return;
        }

        await this.resolveCommandsUnsuccessfully(message, '', command.name);

        message.reset();
        return;
      }

      const subcommands = command.subcommands.filter(
        subcommand =>
          subcommand.name === subcommandName || subcommand.alias.includes(subcommandName),
      );

      if (subcommands.length === 0) {
        await this.resolveCommandsUnsuccessfully(message, subcommandName, command.name);

        message.reset();
        return;
      }

      subcommands.forEach(subcommand => {
        this._dispatchCommandsRecursively(subcommand, message, rest);
      });
    } else {
      await command.triggerLifecycles(message, args);

      message.reset();
    }
  }

  /**
   * Parse a message content and return the command prefix, name and arguments
   * @param content The message content
   */
  public parseCommand(content: string): [string, string, string[]] {
    const [commandName, ...commandArgs] = content
      .substring(1, content.length)
      .trim()
      .split(/ +/g);

    return [content.substring(0, 1), commandName, commandArgs];
  }

  /**
   * Delete all responses of a message
   * @param message The created message
   */
  public deleteResponses(message: Discord.Message) {
    const commandMessage = this._commandMessages.get(message.id);

    if (commandMessage == null) return;

    commandMessage.deleteResponses();
    this._commandMessages.delete(message.id);
  }

  private _sweep() {
    this._commandMessages.sweep(
      message =>
        Date.now() - (message.editedTimestamp || message.createdTimestamp) >
        this.addon.client.options.commandMessageLifetime,
    );

    if (this._commandMessages.size === 0) {
      clearInterval(this._sweepInterval!);

      this._sweepInterval = null;
    }
  }

  /**
   * Invoked when the command name doesn't resolve to any commands
   * @param message The Nebula message wrapper
   * @param name The name of the command
   * @param parent The name of the parent command
   */
  protected async resolveCommandsUnsuccessfully(
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
  public async run(message: Discord.Message) {
    const [commandPrefix, commandName, commandArgs] = this.parseCommand(message.content);

    if (commandPrefix !== this.addon.client.options.prefix) return;

    if (this.addon.client.options.typing) message.channel.startTyping();

    // We allow multiple commands to be ran at the same time
    const commands = this.addon.store.commands.filter(
      command => command.name === commandName || command.alias.includes(commandName),
    );

    let commandMessage = this.addon.client.options.editCommandResponses
      ? this._commandMessages.get(message.id)
      : new CommandMessage(message);

    // If editCommandResponses is false, commandMessage will never be null, so this block won't be
    // executed
    if (commandMessage == null) {
      commandMessage = new CommandMessage(message);

      this._commandMessages.set(message.id, commandMessage);

      if (!this._sweepInterval) {
        this._sweepInterval = setInterval(this._sweep.bind(this), 30000);
      }
    }

    if (commands.length === 0) {
      if (this.resolveCommandsUnsuccessfully) {
        await this.resolveCommandsUnsuccessfully(commandMessage, commandName);

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
