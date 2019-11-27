import Addon from './Addon';

export default class Resource {
  /**
   * The addon of the resource
   */
  protected addon: Addon;

  /**
   * The name of the resource
   */
  public name: string;

  /**
   * The group of the resource
   */
  public group: string;

  /**
   * The base structure for all Nebula resources
   * @param addon The addon of the resource
   * @param name The name of the resource
   * @param group The group of the resource
   */
  constructor(addon: Addon, name = '', group = '') {
    this.addon = addon;
    this.name = name;
    this.group = group;
  }
}
