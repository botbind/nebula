import Addon from './Addon';

export default class Resource {
  /**
   * The addon of the resource
   */
  protected addon: Addon;

  /**
   * Invoked when the resource becomes ready to start working
   */
  public async didReady?(): Promise<void>;

  /**
   * The base structure for all Nebula resources
   * @param addon The addon of the resource
   */
  constructor(addon: Addon) {
    this.addon = addon;
  }
}
