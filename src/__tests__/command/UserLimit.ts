import Discord from 'discord.js';
import { Command, Client } from '../..';

export default class UserLimitCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'u',
      limit: {
        time: 5000,
      },
    });
  }

  async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for user limit');
  }

  async didDispatch(message: Discord.Message) {
    message.channel.send(
      `You have ${this.options.limit.limit -
        this.usage.get(message.author.id)![0]} time(s) left before cooling down. Scope: User`,
    );
  }
}
