import Discord from 'discord.js';
import { Command, Client } from '../..';

export default class TestCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'test',
      alias: ['t'],
    });
  }

  public ready(message: Discord.Message) {
    message.channel.send('Hi, it works!');
  }
}
