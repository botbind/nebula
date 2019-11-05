import Discord from 'discord.js';
import { Event, Addon } from '../..';

export default class MessageEvent extends Event {
  constructor(addon: Addon, name: string, group: string) {
    super(addon, name, group, {
      name: 'message',
      once: false,
    });
  }

  protected async run(message: Discord.Message) {
    if (message.author.bot) return;

    message.channel.send('Hi, Im from event!');
  }
}
