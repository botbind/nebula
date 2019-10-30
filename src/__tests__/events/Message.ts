import Discord from 'discord.js';
import { Event, Addon } from '../..';

export default class MessageEvent extends Event {
  constructor(addon: Addon) {
    super(addon, {
      name: 'message',
      once: false,
    });
  }

  protected async didDispatch(message: Discord.Message) {
    if (message.author.bot) return;

    message.channel.send('Hi, Im from event!');
  }
}
