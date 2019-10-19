import Discord from 'discord.js';
import Addon from './Addon';
import Message from './Message';
import NebulaError from './NebulaError';

/**
 * The function that returns whether a member is allowed to run a command
 */
export type PermissionCheck = (message: Message) => Promise<boolean>;

export default class Permissions extends Discord.Collection<number, PermissionCheck> {
  /**
   * The addon that permissions are applied to
   */
  protected addon: Addon;

  /**
   * The main hub for interacting with permissions
   * @param addon The addon of that the permissions are applied to
   */
  constructor(addon: Addon) {
    super();

    this.addon = addon;

    this.set(0, async () => true)
      .set(6, async message => message.member.permissions.has('MANAGE_GUILD'))
      .set(7, async message => message.member.permissions.has('ADMINISTRATOR'))
      .set(8, async message => message.member === message.guild.owner)
      .set(10, async message => this.addon.client.options.owners.includes(message.author.id));
  }

  /**
   * Check if a user has an exact permission level
   * @param level The level of the permission
   * @param message The created message
   */
  public async checkExact(level: number, message: Message) {
    const check = this.get(level);

    if (check == null) throw new NebulaError(`Permission level ${level} not found`);

    const result = await check(message);

    return result;
  }

  /**
   * Check if a user has enough permission
   * @param level The level of the permission
   * @param message The created message
   */
  public async check(level: number, message: Message) {
    for (const [permissionLevel, permissionCheck] of this.entries()) {
      if (permissionLevel > level) {
        const result = await permissionCheck(message);

        if (result) return true;
      }
    }

    return false;
  }
}
