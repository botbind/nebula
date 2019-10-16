import Discord from 'discord.js';
import { Command, Addon } from '../..';

export default class GuildLimitCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'g',
      limit: {
        time: 5000,
        scope: 'guild',
      },
    });
  }

  protected async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for guild limit');
  }

  public async didDispatch(message: Discord.Message) {
    message.channel.send(
      `You have ${this.options.limit.bucket -
        this.usage.get(message.guild.id)![0]} time(s) left before cooling down. Scope: Guild`,
    );
  }
}
