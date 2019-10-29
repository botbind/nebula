import Addon from './Addon';

export default class Resource {
  /**
   * The addon of the resource
   */
  protected addon: Addon;

  private _group?: string;

  /**
   * The group of the resource
   */
  get group() {
    return this._group!;
  }

  set group(group: string) {
    this._group = group;
  }

  /**
   * The base structure for all Nebula resources
   * @param addon The addon of the resource
   */
  constructor(addon: Addon) {
    this.addon = addon;

    // Allows async function to be executed when the resource is ready
    if (this.didReady) this.didReady();
  }

  /**
   * Invoked when the resource becomes ready to start working
   */
  protected async didReady?(): Promise<void>;
}
