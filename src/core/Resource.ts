import L from '@botbind/lyra';
import Addon from './Addon';

export default class Resource {
  /**
   * The addon of the resource.
   */
  addon: Addon;

  /**
   * The name of the resource.
   */
  name: string;

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
  constructor(addon: Addon, name: string, group: string) {
    const result = L.object({
      addon: L.object()
        .instance(Addon)
        .required(),
      name: L.string().default(''),
      group: L.string().default(''),
    }).validate({
      addon,
      name,
      group,
    });

    if (result.errors !== null) throw result.errors[0];

    const { addon: validatedAddon, name: validatedName, group: validatedGroup } = result.value;

    this.addon = validatedAddon as Addon;
    this.name = validatedName;
    this.group = validatedGroup;
  }
}
