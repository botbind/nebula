import { Event, Addon } from '../..';

export default class MessageEvent extends Event {
  constructor(addon: Addon) {
    super(addon, {
      name: 'message',
      once: false,
    });
  }

  public async didDispatch() {}
}
