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
