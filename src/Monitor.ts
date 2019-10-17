import Addon from './Addon';

export default class Monitor {
  /**
   * The addon of the command
   */
  protected addon: Addon;

  /**
   * Invoked when the monitor becomes ready to start working
   */
  public async didReady?(): Promise<void>;

  constructor(addon: Addon) {
    this.addon = addon;
  }
}
