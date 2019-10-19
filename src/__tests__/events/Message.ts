import { Event, Addon, Message } from '../..';

export default class MessageEvent extends Event {
  constructor(addon: Addon) {
    super(addon, {
      name: 'message',
      once: false,
    });
  }

  public async didDispatch(message: Message) {
    if (message.author.bot) return;

    message.send('Hi, Im from event!');
  }
}
