import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Util from './Util';
import NebulaError from './NebulaError';
import { Schema, ValidationResults } from './Validator';
import ValidationError from './Validator/ValidationError';
import { Constructor, MakeOptsRequired } from './types';

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

interface DefaultCommandOptions {
  /**
   * The alias of the command
   */
  alias: string[];

  /**
   * The description of the command
   */
  description: string;

  /**
   * Whether the command is NSFW
   */
  nsfw: boolean;

  /**
   * Whether the command is a subcommand
   */
  isSubcommand: boolean;

  /**
   * The usage limit for the command
   */
  limit: LimitOptions;

  /**
   * The subcommands for the command
   */
  subcommands: SubcommandsOptions;

  /**
   * The permission options for the command
   */
  permission: PermissionOptions;

  /**
   * The required Discord permissions for the command
   */
  requiredPermissions: Discord.PermissionResolvable[];
}

interface RequiredCommandOptions {
  /**
   * The name of the command
   */
  name: string;

  /**
   * The validation schema of the command
   */
  schema?: Schema;
}

type EnhancedDefaultCommandOptions = MakeOptsRequired<
  MakeOptsRequired<
    MakeOptsRequired<DefaultCommandOptions, 'limit', 'bucket' | 'scope'>,
    'subcommands',
    'defaultToFirst'
  >,
  'permission',
  'exact'
>;

/**
 * The options for the command
 */
export type CommandOptions = EnhancedDefaultCommandOptions & RequiredCommandOptions;

/**
 * The options passed as argument for the command
 */
export type CommandOptionsArg = Partial<DefaultCommandOptions> & RequiredCommandOptions;

const limitScopes = ['user', 'guild'];

const defaultOptions: EnhancedDefaultCommandOptions = {
  alias: [],
  description: '',
  nsfw: false,
  limit: {
    bucket: 1,
    scope: 'user',
  },
  subcommands: {
    defaultToFirst: false,
  },
  isSubcommand: false,
  permission: {
    exact: false,
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
  readonly name: string;

  /**
   * The alias of the command
   */
  readonly alias: string[];

  /**
   * The description of the command
   */
  readonly description?: string;

  /**
   * The options of the command
   */
  readonly options: CommandOptions;

  /**
   * The usage of the command
   */
  protected usage: Discord.Collection<string, [number, number]>;

  /**
   * The instantiated subcommands of this command
   */
  instantiatedSubcommands: Command[];

  private _sweepInterval: NodeJS.Timeout | null;

  /**
   * Invoked when the command becomes ready to start working
   */
  didReady?(): void;

  /**
   * Invoked after the command is inhibited due to it being run in a non-nsfw channel
   * @param message The created message
   * @param args The user arguments
   */
  didInhibitNSFW(message: Discord.Message) {
    message.channel.send('This command should only be sent in a NSFW channel');
  }

  /**
   * Invoked after the command is inhibited due to excess usage per user
   * @param message The created message
   * @param args The user arguments
   */
  didInhibitLimit(message: Discord.Message) {
    const id = this.options.limit.scope === 'guild' ? message.guild.id : message.author.id;
    const timeLeft = (this.options.limit.time! - (Date.now() - this.usage.get(id)![1])) / 1000;

    message.channel.send(`You have ${timeLeft} seconds left before you can run this command again`);
  }

  /**
   * Invoked after the command is inhibited due to not enough permissions
   * @param message The created message
   * @param args The user arguments
   */
  didInhibitPerm(message: Discord.Message) {
    message.channel.send('You are not allowed to run this command!');
  }

  /**
   * Whether the command should be dispatched
   * @param message The created message
   * @param args The user arguments
   */
  willDispatch?(message: Discord.Message): Promise<void | boolean>;

  /**
   * Invoked when the user arguments don't meet the validation schema
   * @param message The created message
   * @param results The validation results. Errors only.
   */
  didCatchValidationErrors(message: Discord.Message, results: ValidationResults) {
    Object.values(results).forEach(errs => {
      (errs as ValidationError[]).forEach(err => {
        message.channel.send(err.message);
      });
    });
  }

  /**
   * Invoked when the command is dispatched
   * @param message The created message
   * @param args The user arguments
   */
  didDispatch?(message: Discord.Message, args?: ValidationResults): Promise<void | boolean>;

  /**
   * Invoked when the command is successfully dispatched
   * @param message The created message
   * @param args The user arguments
   */
  didDispatchSuccessfully?(message: Discord.Message, args?: ValidationResults): Promise<void>;

  /**
   * Invoked when the command fails
   * @param message The created message
   * @param args The user arguments
   */
  didDispatchUnsuccessfully?(message: Discord.Message, args?: ValidationResults): Promise<void>;

  /**
   * The base class for all Nebula commands
   * @param client The client of the command
   * @param options The options of the command
   */
  constructor(addon: Addon, options: CommandOptionsArg) {
    if (!Util.isObject(options)) throw new NebulaError('The options for Command must be an object');

    if (options.limit) {
      if (options.limit.scope && !limitScopes.includes(options.limit.scope))
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
      options.subcommands &&
      (!options.subcommands.commands || !options.subcommands.commands.length)
    )
      throw new NebulaError('The commands for subcommands options must have at least a command');

    if (options.permission && options.permission.level == null)
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

    if (this.options.subcommands.commands)
      this.instantiatedSubcommands = this.options.subcommands.commands.map(Subcommand => {
        if (!(Subcommand.prototype instanceof Command))
          throw new NebulaError('subcommands must inherit the Command class');

        const subcommand = new Subcommand(this.addon);

        if (!subcommand.options.isSubcommand)
          throw new NebulaError('subcommands must have isSubcommand set to true');

        return new Subcommand(this.addon);
      });
  }

  /**
   * Whether the command should be inhibited due to excess usage
   * @param message The created message
   * @param args The user arguments
   */
  shouldInhibitLimit(message: Discord.Message) {
    if (!this.options.limit.time) return false;

    const currTime = Date.now();
    const id = this.options.limit.scope === 'guild' ? message.guild.id : message.author.id;
    const usage = this.usage.get(id);

    if (usage) {
      const [bucket, time] = usage;

      if (currTime - time > this.options.limit.time) {
        this.usage.set(id, [1, currTime]);

        return false;
      } else if (bucket === this.options.limit.bucket) return true;

      this.usage.set(id, [bucket + 1, currTime]);
    } else {
      this.usage.set(id, [1, currTime]);

      if (!this._sweepInterval) this._sweepInterval = setInterval(this._sweep.bind(this), 30000);
    }

    return false;
  }

  private _sweep() {
    const currTime = Date.now();

    this.usage.sweep(([, time]) => currTime - time > this.options.limit.time!);

    if (!this.usage.size) {
      clearInterval(this._sweepInterval!);

      this._sweepInterval = null;
    }
  }

  /**
   * Whether the command should be inhibited due to it being run in a non-nsfw channel
   * @param message The created message
   */
  shouldInhibitNSFW(message: Discord.Message) {
    return this.options.nsfw && !(message.channel as Discord.TextChannel).nsfw;
  }

  /**
   * Whether the command should be inhibited due to not enough permissions
   * @param message The created message
   */
  async shouldInhibitPerm(message: Discord.Message) {
    const permissionLevel = this.options.permission.level;

    if (permissionLevel != null) {
      if (this.options.permission.exact) {
        const result = await this.addon.permissions.checkExact(permissionLevel, message);
        return !result;
      }

      const result = await this.addon.permissions.checkCascadingly(permissionLevel, message);
      return !result;
    }
  }
}
