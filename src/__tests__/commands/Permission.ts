import Discord from 'discord.js';
import { Command, Addon } from '../..';

export default class PermissionCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'p',
      permission: {
        level: 7,
      },
    });
  }

  public async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for permissions');
  }

  public async didDispatch(message: Discord.Message) {
    message.channel.send('You are allowed to run this command');
  }
}
