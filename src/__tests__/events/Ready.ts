import { Event, Addon } from '../..';

export default class ReadyEvent extends Event {
  constructor(addon: Addon, name: string, group: string) {
    super(addon, name, group, {
      once: true,
    });
  }

  protected async run() {
    console.log('Tests ready!');
  }
}
