import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Resource from './Resource';
import CommandMessage from './CommandMessage';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';
import { Schema, ValidationResults, ValidationErrors } from './Validator';
import ValidationError from './ValidationError';
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

export default class Command extends Resource {
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
   * The subcommands of the command
   */
  public subcommands: Command[];

  private _sweepInterval: NodeJS.Timeout | null;

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

    if (options.schema != null) {
      if (!Util.isObject(options.schema))
        throw new NebulaError(`The validation schema must be an object with validators`);
    }

    super(addon);

    const mergedOptions = merge({}, defaultOptions, options);

    const { name, alias, description } = mergedOptions;

    this.name = name;
    this.alias = alias;
    this.description = description;
    this.options = mergedOptions;
    this.usage = new Discord.Collection();
    this._sweepInterval = null;

    // Recursively instantiate subcommands
    this.subcommands = this.options.subcommands.commands.map(Subcommand => {
      if (!(Subcommand.prototype instanceof Command))
        throw new NebulaError('subcommands must inherit the Command structure');

      const subcommand = new Subcommand(this.addon);

      if (subcommand.options.subcommands.defaultToFirst && subcommand.subcommands[0])
        throw new NebulaError('Default subcommands must not have schema');

      if (!subcommand.options.isSubcommand)
        throw new NebulaError('subcommands must have isSubcommand set to true');

      return new Subcommand(this.addon);
    });
  }

  /**
   * Whether the command is allowed to dispatch considering the limit usage
   */
  protected async allowUsage(message: CommandMessage) {
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
   */
  protected async allowNSFW(message: CommandMessage) {
    return !this.options.nsfw || (message.channel as Discord.TextChannel).nsfw;
  }

  /**
   * Whether the command is allowed to dispatch considering the permission levels
   * @param message The Nebula message wrapper
   */
  protected async allowPerm(message: CommandMessage) {
    const permissionLevel = this.options.permission.level;

    if (this.options.permission.exact)
      return this.addon.permissions.checkExact(permissionLevel, message.message);

    return this.addon.permissions.check(permissionLevel, message.message);
  }

  /**
   * Call all the lifecycle methods
   * @param message The Nebula message wrapper
   * @param args The parsed user arguments
   */
  public async callLifecycles(message: CommandMessage, args: string[]) {
    const constructorName = this.constructor.name;

    // We have to use await on lifecycle methods for safety reasons
    // This allows right execution order and command editing to work
    if (this.willDispatch != null) {
      Debugger.info(`${constructorName} willDispatch`, 'Lifecycle');

      await this.willDispatch(message);
    }

    let shouldDispatch = true;

    if (this.shouldDispatch) {
      Debugger.info(`${constructorName} shouldDispatch`, 'Lifecycle');

      shouldDispatch = await this.shouldDispatch(message);
    }

    if (!shouldDispatch) return;

    const allowUsage = await this.allowUsage(message);

    if (!allowUsage) {
      Debugger.info(`${constructorName} didInhibitUsage`, 'Lifecycle');

      await this.didInhibitUsage(message);

      return;
    }

    const allowNSFW = await this.allowNSFW(message);

    if (!allowNSFW) {
      Debugger.info(`${constructorName} didInhibitNSFW`, 'Lifecycle');

      await this.didInhibitNSFW(message);

      return;
    }

    const allowPerm = await this.allowPerm(message);

    if (!allowPerm) {
      Debugger.info(`${constructorName} didInhibitPerm`, 'Lifecycle');

      await this.didInhibitPerm(message);

      return;
    }

    let validatedArgs;

    if (this.options.schema) {
      const results = this.addon.validator.validate(message.message, args, this.options.schema);
      const errors = Util.entriesOf(results).filter(([, result]) => Util.isArray(result)) as [
        string,
        ValidationError[],
      ][];

      if (errors.length) {
        Debugger.info(`${constructorName} didCatchValidationErrors`, 'Lifecycle');

        await this.didCatchValidationErrors(
          message,
          errors.reduce(
            (res, [key, result]) => {
              res[key] = result;

              return res;
            },
            {} as ValidationErrors,
          ),
        );

        return;
      }

      validatedArgs = results as ValidationResults;
    }

    if (this.didDispatch == null) return;

    let isSuccessfullyDispatched = true;

    // Here we use try...catch statement to improve DX: This allows the devs to throw an error and
    // it would have the same effect as returning it for returning false
    try {
      Debugger.info(`${constructorName} didDispatch`, 'Lifecycle');

      const dispatchResult = await this.didDispatch(message, validatedArgs);

      if (dispatchResult instanceof Error || (dispatchResult !== undefined && !dispatchResult))
        isSuccessfullyDispatched = false;
    } catch (err) {
      Debugger.error(err);
      isSuccessfullyDispatched = false;
    }

    if (!isSuccessfullyDispatched) {
      if (this.didDispatchUnsuccessfully) {
        Debugger.info(`${constructorName} didDispatchUnsuccessfully`, 'Lifecycle');

        await this.didDispatchUnsuccessfully(message, validatedArgs);
      }
    } else if (this.didDispatchSuccessfully) {
      Debugger.info(`${constructorName} didDispatchSuccessfully`, 'Lifecycle');

      await this.didDispatchSuccessfully(message, validatedArgs);
    }
  }

  /**
   * Invoked after the command is inhibited due to it being run in a non-nsfw channel
   * @param message The Nebula message wrapper
   */
  protected async didInhibitNSFW(message: CommandMessage) {
    message.send('This command should only be sent in a NSFW channel');
  }

  /**
   * Invoked after the command is inhibited due to excess usage per user
   * @param message The Nebula message wrapper
   */
  protected async didInhibitUsage(message: CommandMessage) {
    const id = this.options.limit.scope === 'guild' ? message.guild.id : message.author.id;
    const timeLeft = (this.options.limit.time - (Date.now() - this.usage.get(id)![1])) / 1000;

    message.send(`You have ${timeLeft} seconds left before you can run this command again`);
  }

  /**
   * Invoked after the command is inhibited due to not enough permissions
   * @param message The Nebula message wrapper
   */
  protected async didInhibitPerm(message: CommandMessage) {
    message.send('You are not allowed to run this command!');
  }

  /**
   * Invoked when the user arguments don't meet the validation schema
   * @param message The Nebula message wrapper
   * @param validationErrs The validation erros.
   */
  protected async didCatchValidationErrors(
    message: CommandMessage,
    validationErrs: ValidationErrors,
  ) {
    Object.values(validationErrs).forEach(errs => {
      errs.forEach(err => {
        message.send(err.message);
      });
    });
  }

  /**
   * Invoked when the command before the command is processed
   */
  protected async willDispatch?(message: CommandMessage): Promise<void>;

  /**
   * Whether the command should be dispatched
   */
  protected async shouldDispatch?(message: CommandMessage): Promise<boolean>;

  /**
   * Invoked when the command is dispatched
   * @param args The user arguments
   */
  protected async didDispatch?(
    message: CommandMessage,
    args?: ValidationResults,
  ): Promise<void | boolean | Error>;

  /**
   * Invoked when the command is successfully dispatched
   * @param args The user arguments
   */
  protected async didDispatchSuccessfully?(
    message: CommandMessage,
    args?: ValidationResults,
  ): Promise<void>;

  /**
   * Invoked when the command fails
   * @param args The user arguments
   */
  protected async didDispatchUnsuccessfully?(
    message: CommandMessage,
    args?: ValidationResults,
  ): Promise<void>;
}
