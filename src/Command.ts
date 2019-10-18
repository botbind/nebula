import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Util from './Util';
import NebulaError from './NebulaError';
import { Schema, ValidationResults, ValidationErrors } from './Validator';
import { Constructor, RequiredExcept } from './types';

/**
 * The limit scopes
 */
export type LimitScopes = 'user' | 'guild';

/**
 * The options for limit
 */
export interface LimitOptions {
  /**
   * The number of times the command can be ran in a specified amount of time. Cooldown is disabled if set to 0
   */
  bucket?: number;

  /**
   * The amount of time in milliseconds that the limit applies
   */
  time: number;

  /**
   * The limit scope of the command
   */
  scope?: LimitScopes;
}

/**
 * The options for subcommands
 */
export interface SubcommandsOptions {
  /**
   * Whether the default subcommand should be the first in the list
   */
  defaultToFirst?: boolean;

  /**
   * The list of subcomands of the command
   */
  commands: Constructor<Command>[];
}

/**
 * The options for permissions
 */
export interface PermissionOptions {
  /**
   * Whether the command should only be dispatched with an exact permission level
   */
  exact?: boolean;

  /**
   * The minimum permission level required for the command
   */
  level: number;
}

/**
 * The optional options passed as arguments to the command
 */
export interface OptionalCommandOptions {
  /**
   * The name of the command
   */
  name: string;

  /**
   * The alias of the command
   */
  alias?: string[];

  /**
   * The description of the command
   */
  description?: string;

  /**
   * Whether the command is NSFW
   */
  nsfw?: boolean;

  /**
   * Whether the command is a subcommand
   */
  isSubcommand?: boolean;

  /**
   * The required Discord permissions for the command
   */
  requiredPermissions?: Discord.PermissionResolvable[];

  /**
   * The usage limit for the command
   */
  limit?: LimitOptions;

  /**
   * The subcommands for the command
   */
  subcommands?: SubcommandsOptions;

  /**
   * The permission options for the command
   */
  permission?: PermissionOptions;

  /**
   * The validation schema of the command
   */
  schema?: Schema;
}

/**
 * The options for the command
 */
export interface CommandOptions extends RequiredExcept<OptionalCommandOptions, 'schema'> {
  limit: Required<LimitOptions>;
  subcommands: Required<SubcommandsOptions>;
  permission: Required<PermissionOptions>;
}

const limitScopes = ['user', 'guild'];

const defaultOptions: CommandOptions = {
  name: '',
  alias: [],
  description: '',
  nsfw: false,
  limit: {
    bucket: 1,
    scope: 'user',
    time: 0,
  },
  subcommands: {
    defaultToFirst: false,
    commands: [],
  },
  isSubcommand: false,
  permission: {
    exact: false,
    level: 0,
  },
  requiredPermissions: [],
};

export default class Command {
  /**
   * The addon of the command
   */
  protected addon: Addon;

  /**
   * The name of the command
   */
  public name: string;

  /**
   * The alias of the command
   */
  public alias: string[];

  /**
   * The description of the command
   */
  public description?: string;

  /**
   * The options of the command
   */
  public options: CommandOptions;

  /**
   * The usage of the command
   */
  protected usage: Discord.Collection<string, [number, number]>;

  /**
   * The instantiated subcommands of this command
   */
  public instantiatedSubcommands: Command[];

  private _sweepInterval: NodeJS.Timeout | null;

  /**
   * Invoked when the command becomes ready to start working
   */
  public async didReady?(): Promise<void>;

  /**
   * Invoked after the command is inhibited due to it being run in a non-nsfw channel
   * @param message The created message
   */
  protected async didInhibitNSFW(message: Discord.Message) {
    message.channel.send('This command should only be sent in a NSFW channel');
  }

  /**
   * Invoked after the command is inhibited due to excess usage per user
   * @param message The created message
   */
  protected async didInhibitUsage(message: Discord.Message) {
    const id = this.options.limit.scope === 'guild' ? message.guild.id : message.author.id;
    const timeLeft = (this.options.limit.time - (Date.now() - this.usage.get(id)![1])) / 1000;

    message.channel.send(`You have ${timeLeft} seconds left before you can run this command again`);
  }

  /**
   * Invoked after the command is inhibited due to not enough permissions
   * @param message The created message
   */
  protected async didInhibitPerm(message: Discord.Message) {
    return message.channel.send('You are not allowed to run this command!');
  }

  /**
   * Invoked when the user arguments don't meet the validation schema
   * @param message The created message
   * @param validationErrs The validation erros.
   */
  public async didCatchValidationErrors(
    message: Discord.Message,
    validationErrs: ValidationErrors,
  ) {
    Object.values(validationErrs).forEach(errs => {
      errs.forEach(err => {
        message.channel.send(err.message);
      });
    });
  }

  /**
   * Invoked when the command before the command is processed
   * @param message The created message
   */
  public async willDispatch?(message: Discord.Message): Promise<void>;

  /**
   * Whether the command should be dispatched
   * @param message The created message
   */
  public async shouldDispatch?(message: Discord.Message): Promise<boolean>;

  /**
   * Invoked when the command is dispatched
   * @param message The created message
   * @param args The user arguments
   */
  public async didDispatch?(
    message: Discord.Message,
    args?: ValidationResults,
  ): Promise<void | boolean | Error>;

  /**
   * Invoked when the command is successfully dispatched
   * @param message The created message
   * @param args The user arguments
   */
  public async didDispatchSuccessfully?(
    message: Discord.Message,
    args?: ValidationResults,
  ): Promise<void>;

  /**
   * Invoked when the command fails
   * @param message The created message
   * @param args The user arguments
   */
  public async didDispatchUnsuccessfully?(
    message: Discord.Message,
    args?: ValidationResults,
  ): Promise<void>;

  /**
   * Compose the inhibitors and run shouldDispatch under the hood
   * @param message The created message
   */
  public async composeInhibitors(message: Discord.Message) {
    let shouldDispatch = true;

    if (this.shouldDispatch) shouldDispatch = await this.shouldDispatch(message);

    if (!shouldDispatch) return false;

    const allowUsage = await this.allowUsage(message);

    if (!allowUsage) {
      this.didInhibitUsage(message);

      return false;
    }

    const allowNSFW = await this.allowNSFW(message);

    if (!allowNSFW) {
      this.didInhibitNSFW(message);

      return false;
    }

    const allowPerm = await this.allowPerm(message);

    if (!allowPerm) {
      this.didInhibitPerm(message);

      return false;
    }

    return true;
  }

  /**
   * The base structure for all Nebula commands
   * @param client The client of the command
   * @param options The options of the command
   */
  constructor(addon: Addon, options: OptionalCommandOptions) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the command must be an object');

    if (options.name == null) throw new NebulaError('The name of the command must be specified');

    if (options.limit != null) {
      if (options.limit.scope != null && !limitScopes.includes(options.limit.scope))
        throw new NebulaError('The limit scope must be either user or guild');

      if (options.limit.bucket != null && options.limit.bucket <= 0)
        throw new NebulaError('The limit bucket must be greater than 1');

      if (options.limit.time == null)
        throw new NebulaError(
          'The limit time must be specified when the limit options are specified',
        );

      if (options.limit.time <= 0) throw new NebulaError('The limit must be greater than 0');
    }

    if (
      options.subcommands != null &&
      (!options.subcommands.commands || !options.subcommands.commands.length)
    )
      throw new NebulaError('The commands for subcommands options must have at least a command');

    if (options.permission != null && options.permission.level == null)
      throw new NebulaError(
        'The permission level must be specified when permission options are specified',
      );

    const mergedOptions = merge({}, defaultOptions, options);
    const { name, alias, description } = mergedOptions;

    this.addon = addon;
    this.name = name;
    this.alias = alias;
    this.description = description;
    this.options = mergedOptions;
    this.usage = new Discord.Collection();
    this._sweepInterval = null;

    this.instantiatedSubcommands = this.options.subcommands.commands.map(Subcommand => {
      if (!(Subcommand.prototype instanceof Command))
        throw new NebulaError('subcommands must inherit the Command structure');

      const subcommand = new Subcommand(this.addon);

      if (!subcommand.options.isSubcommand)
        throw new NebulaError('subcommands must have isSubcommand set to true');

      return new Subcommand(this.addon);
    });
  }

  /**
   * Whether the command is allowed to dispatch considering the limit usage
   * @param message The created message
   */
  protected async allowUsage(message: Discord.Message) {
    if (this.options.limit.time === 0) return true;

    const currTime = Date.now();
    const id = this.options.limit.scope === 'guild' ? message.guild.id : message.author.id;
    const usage = this.usage.get(id);

    if (usage) {
      const [bucket, time] = usage;

      if (currTime - time > this.options.limit.time) {
        this.usage.set(id, [1, currTime]);

        return true;
      }

      if (bucket === this.options.limit.bucket) return false;

      this.usage.set(id, [bucket + 1, currTime]);
    } else {
      this.usage.set(id, [1, currTime]);

      if (this._sweepInterval == null)
        this._sweepInterval = setInterval(this._sweep.bind(this), 30000);
    }

    return true;
  }

  private _sweep() {
    const currTime = Date.now();

    this.usage.sweep(([, time]) => currTime - time > this.options.limit.time);

    if (this.usage.size === 0) {
      clearInterval(this._sweepInterval!);

      this._sweepInterval = null;
    }
  }

  /**
   * Whether the command is allowed to dispatch in a non-nsfw channel if marked nsfw
   * @param message The created message
   */
  protected async allowNSFW(message: Discord.Message) {
    return !this.options.nsfw || (message.channel as Discord.TextChannel).nsfw;
  }

  /**
   * Whether the command is allowed to dispatch considering the permission levels
   * @param message The created message
   */
  protected async allowPerm(message: Discord.Message) {
    const permissionLevel = this.options.permission.level;

    if (this.options.permission.exact)
      return this.addon.permissions.checkExact(permissionLevel, message);

    return this.addon.permissions.check(permissionLevel, message);
  }
}
