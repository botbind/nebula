import { Event, Addon } from '../..';

export default class ReadyEvent extends Event {
  constructor(addon: Addon) {
    super(addon, {
      name: 'ready',
      once: true,
    });
  }

  public async didDispatch() {
    console.log('Tests ready!');
  }
}
