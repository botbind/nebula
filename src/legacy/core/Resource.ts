import L from '@botbind/lyra';
import Addon from './Addon';

/**
 * The options for the resource.
 */
export interface ResourceOptions {
  /**
   * The addon of the resource.
   */
  addon: Addon;

  /**
   * The file name of the resource.
   */
  filename: string;

  /**
   * The group of the resource.
   */
  group: string;
}

export default class Resource {
  /**
   * The addon of the resource.
   */
  addon: Addon;

  /**
   * The file name of the resource.
   */
  filename: string;

  /**
   * The group of the resource.
   */
  group: string;

  /**
   * The base structure for all Nebula resources.
   * @param addon The addon of the resource.
   * @param name The name of the resource.
   * @param group The group of the resource.
   */
  constructor(opts: ResourceOptions) {
    const result = L.object({
      addon: L.object()
        .instance(Addon)
        .required(),
      filename: L.string().default(''),
      group: L.string().default(''),
    })
      .label('Resource options')
      .validate(opts);

    if (result.errors !== null) throw result.errors[0];

    const { addon, filename, group } = result.value;

    this.addon = addon as Addon;
    this.filename = filename;
    this.group = group;
  }
}
