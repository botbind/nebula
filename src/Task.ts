import Addon from './Addon';

export interface TaskOptions {
  /**
   * The name of the task
   */
  name: string;
}

export default class Task {
  protected addon: Addon;

  public async didReady?(): Promise<void>;

  constructor(addon: Addon) {
    this.addon = addon;
  }
}
