import Discord from 'discord.js';
import merge from 'lodash.merge';
import Client from './Client';
import { Permissions } from './Addon';
import Util from './Util';
import NebulaError from './NebulaError';
import { Schema, ValidationResults } from './Validator';
import ValidationError from './Validator/ValidationError';
import { Constructor } from './types';

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
  time: number | null;

  /**
   * The limit scope of the command
   */
  scope?: LimitScopes;
}

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

export interface PermissionOptions {
  /**
   * Whether the command requires the exact permission level
   */
  exact?: boolean;

  /**
   * The permission level for the command
   */
  level: number;
}

/**
 * The optional options for the command
 */
export interface OptionalCommandOptions {
  /**
   * The alias of the command
   */
  alias: string[];

  /**
   * The description of the command
   */
  description: string;

  /**
   * The validation schema of the command
   */
  schema: Schema | null;

  /**
   * The usage limit for the command
   */
  limit: LimitOptions;

  /**
   * Whether the command is NSFW
   */
  nsfw: boolean;

  /**
   * The subcommands for the command
   */
  subcommands: SubcommandsOptions | null;

  /**
   * Whether the command is a subcommand
   */
  isSubcommand: boolean;

  /**
   * The permission options for the command
   */
  permission: PermissionOptions;
}

/**
 * The required options of the command
 */
export interface RequiredCommandOptions {
  /**
   * The name of the command
   */
  name: string;
}

/**
 * The options for the command
 */
export type CommandOptions = Omit<
  OptionalCommandOptions & RequiredCommandOptions,
  'name' | 'description' | 'alias'
>;

/**
 * The options passed as argument for the command
 */
export type CommandOptionsArg = Partial<OptionalCommandOptions> & RequiredCommandOptions;

const limitScopes = ['user', 'guild'];

const defaultOptions: OptionalCommandOptions = {
  alias: [],
  description: '',
  schema: null,
  nsfw: false,
  limit: {
    bucket: 1,
    scope: 'user',
    time: null,
  },
  subcommands: null,
  isSubcommand: false,
  permission: {
    exact: false,
    level: 0,
  },
};

export default class Command {
  /**
   * The client of the command
   */
  protected client: Client;

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
  instantiatedSubcommands?: Command[];

  private _sweepInterval: NodeJS.Timeout | null;

  /**
   * Invoked when the command becomes ready to start working
   */
  didReady?(): void;

  /**
   * Invoked after the NSFW-marked command is inhibited
   * @param message The created message
   */
  didInhibitNSFW(message: Discord.Message) {
    message.channel.send('This command should only be sent in a NSFW channel');
  }

  /**
   * Invoked after the command is inhibited due to the lack of permissions
   * @param message The created message
   */
  didInhibitPerm(message: Discord.Message) {
    message.channel.send('You do not have enough permissions to run this command');
  }

  /**
   * Invoked after the command cooldowns due to excess usage per user
   * @param message The created message
   * @param scope The cooldown scope
   */
  didCooldown(message: Discord.Message) {
    const id = this.options.limit.scope === 'guild' ? message.guild.id : message.author.id;
    const timeLeft = (this.options.limit.time! - (Date.now() - this.usage.get(id)![1])) / 1000;

    message.channel.send(`You have ${timeLeft} seconds left before you can run this command again`);
  }

  /**
   * Whether the command should be dispatched
   * @param message The created message
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
   */
  didDispatchSuccessfully?(message: Discord.Message): Promise<void>;

  /**
   * Invoked when the command fails
   * @param message The created message
   */
  didDispatchUnsuccessfully?(message: Discord.Message): Promise<void>;

  /**
   * The base class for all Nebula commands
   * @param client The client of the command
   * @param options The options of the command
   */
  constructor(client: Client, options: CommandOptionsArg) {
    if (!Util.isObject(options)) throw new NebulaError('commandOptions must be an object');

    if (options.limit && options.limit.scope && !limitScopes.includes(options.limit.scope))
      throw new NebulaError('limitScope must be either user or guild');

    if (
      options.subcommands &&
      (!options.subcommands.commands || !options.subcommands.commands.length)
    )
      throw new NebulaError('subcommands must have at least a command');

    const { name, alias, description, ...otherOptions } = merge({}, defaultOptions, options);

    this.client = client;
    this.name = name;
    this.alias = alias;
    this.description = description;
    this.options = otherOptions;
    this.usage = new Discord.Collection();
    this._sweepInterval = null;

    if (this.options.subcommands)
      this.instantiatedSubcommands = this.options.subcommands.commands.map(Subcommand => {
        if (!(Subcommand.prototype instanceof Command))
          throw new NebulaError('subcommands must inherit the Command class');

        const subcommand = new Subcommand(this.client);

        if (!subcommand.options.isSubcommand)
          throw new NebulaError('subcommands must have isSubcommand set to true');

        return new Subcommand(this.client);
      });
  }

  /**
   * Whether the command should cooldown due to excess usage
   * @param message The created message
   */
  shouldCooldown(message: Discord.Message) {
    if (!this.options.limit.time || !this.options.limit.bucket) return false;

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
   * Whether the NSFW-marked command should be inhibited
   * @param message The created message
   */
  shouldInhibitNSFW(message: Discord.Message) {
    return this.options.nsfw && !(message.channel as Discord.TextChannel).nsfw;
  }
}
