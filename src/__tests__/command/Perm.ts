import Discord from 'discord.js';
import { Command, Client } from '../..';

export default class PermCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'p',
      permLevel: 6,
    });
  }

  async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for Permissions');
  }

  async didDispatch(message: Discord.Message) {
    message.channel.send('You are allowed to run this command');
  }
}
