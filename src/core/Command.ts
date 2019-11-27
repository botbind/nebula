import Discord from 'discord.js';
import Addon from './Addon';
import Resource from './Resource';
import CommandMessage from './CommandMessage';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';
import { Schema, ValidationResults, ValidationErrors } from './Validator';
import BaseValidator from './BaseValidator';
import ValidationError from './ValidationError';
import * as Constants from './constants';
import { Constructor } from './types';

/**
 * The limit scopes
 */
export type LimitScopes = 'user' | 'guild';

/**
 * The options for the command
 */
export interface CommandOptions {
  /**
   * The name of the command
   */
  name?: string;

  /**
   * The alias of the command
   */
  alias?: string[];

  /**
   * The description of the command
   */
  description?: string;

  /**
   * The extended description of the command
   */
  extendedDescription?: string;

  /**
   * Whether the command is NSFW
   */
  isNsfw?: boolean;

  /**
   * Whether the command should only run in a guild
   */
  isGuildOnly?: boolean;

  /**
   * Whether the command is a subcommand
   */
  isSubcommand?: boolean;

  /**
   * The required Discord permissions of the command
   */
  requiredPerms?: Discord.PermissionResolvable[];

  /**
   * The number of times the command can be ran in a specified amount of time. Cooldown is disabled if set to 0
   */
  bucket?: number;

  /**
   * The amount of time in milliseconds that the bucket applies
   */
  duration?: number;

  /**
   * The limit scope of the command
   */
  scope?: LimitScopes;

  /**
   * The subcommands of the command
   */
  subcommands?: Constructor<Command>[];

  /**
   * Whether the default subcommand is the first one in the subcommands list
   */
  shouldDefaultToFirstSubcommand?: boolean;

  /**
   * The permission level required to run the command
   */
  permLevel?: number;

  /**
   * Whether the command should only run with an exact permission level
   */
  shouldPermLevelBeExact?: boolean;

  /**
   * The validation schema of the command
   */
  schema?: Schema;
}

const limitScopes = ['user', 'guild'];

export default class Command extends Resource {
  /**
   * The alias of the command
   */
  public alias: string[];

  /**
   * The description of the command
   */
  public description: string;

  /**
   * The extended description of the command
   */
  public extendedDescription: string;

  /**
   * Whether the command is NSFW
   */
  public isNsfw: boolean;

  /**
   * Whether the command should only run in a guild
   */
  public isGuildOnly: boolean;

  /**
   * Whether the command is a subcommand
   */
  public isSubcommand: boolean;

  /**
   * The required Discord permissions for the command
   */
  public requiredPerms: Discord.PermissionResolvable[];

  /**
   * The number of times the command can be ran in a specified amount of time. Cooldown is disabled if set to 0
   */
  public bucket: number;

  /**
   * The amount of time in milliseconds that the bucket applies
   */
  public duration: number;

  /**
   * The limit scope of the command
   */
  public scope: LimitScopes;

  /**
   * The subcommands for the command
   */
  public subcommands: Command[];

  /**
   * Whether the default subcommand is the first one in the subcommands list
   */
  public shouldDefaultToFirstSubcommand: boolean;

  /**
   * The permission options for the command
   */
  public permLevel: number;

  /**
   * Whether the command should only run with an exact permission level
   */
  public shouldPermLevelBeExact: boolean;

  /**
   * The validation schema of the command
   */
  public schema?: Schema;

  /**
   * The usage of the command
   */
  protected usage: Discord.Collection<string, [number, number]>;

  private _sweepInterval: NodeJS.Timeout | null;

  /**
   * The base structure for all Nebula commands
   * @param client The client of the command
   * @param name The name of the command
   * @param group The group of the command
   * @param options The options of the command
   */
  constructor(addon: Addon, name: string, group: string, options: CommandOptions = {}) {
    if (Constants.IS_DEV && !Util.isObject(options))
      throw new NebulaError(Constants.ERROR_MESSAGES['command.options']);

    const {
      name: nameFromOptions = '',
      alias = [],
      description = '',
      extendedDescription = '',
      isNsfw = false,
      isGuildOnly = false,
      isSubcommand = false,
      requiredPerms = [],
      bucket = 1,
      duration = 0,
      scope = 'user',
      subcommands = [],
      shouldDefaultToFirstSubcommand = false,
      permLevel = 0,
      shouldPermLevelBeExact = false,
      schema,
    } = options;

    if (Constants.IS_DEV) {
      if (typeof nameFromOptions !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.name']);

      if (!Array.isArray(alias))
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.alias']);
      else {
        const invalidItem = alias.find(item => typeof item !== 'string');

        if (invalidItem != null)
          throw new NebulaError(
            Constants.ERROR_MESSAGES['command.options.alias.item'](invalidItem),
          );
      }

      if (typeof description !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.description']);

      if (typeof extendedDescription !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.extendedDescription']);

      if (typeof isNsfw !== 'boolean')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.isNsfw']);

      if (typeof isGuildOnly !== 'boolean')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.isGuildOnly']);

      if (typeof isSubcommand !== 'boolean')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.isSubcommand']);

      if (!Array.isArray(requiredPerms))
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.requiredPerms']);

      if (typeof bucket !== 'number')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.bucket']);

      if (typeof duration !== 'number')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.duration']);

      if (!limitScopes.includes(scope))
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.scope']);

      if (!Array.isArray(subcommands))
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.subcommands']);
      else {
        const invalidItem = subcommands.find(item => !(item.prototype instanceof Command));

        if (invalidItem != null)
          throw new NebulaError(
            Constants.ERROR_MESSAGES['command.options.subcommands.item'](invalidItem),
          );
      }

      if (typeof shouldDefaultToFirstSubcommand !== 'boolean')
        throw new NebulaError(
          Constants.ERROR_MESSAGES['command.options.shouldDefaultToFirstSubcommand'],
        );

      if (typeof permLevel !== 'number')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.permLevel']);

      if (typeof shouldPermLevelBeExact !== 'boolean')
        throw new NebulaError(Constants.ERROR_MESSAGES['command.options.shouldPermLevelBeExact']);

      if (schema != null) {
        if (!Util.isObject(schema))
          throw new NebulaError(Constants.ERROR_MESSAGES['command.options.schema']);
        else {
          const invalidItem = Util.entriesOf(schema).find(
            ([, Validator]) => !(Validator instanceof BaseValidator),
          );

          if (invalidItem != null)
            throw new NebulaError(
              Constants.ERROR_MESSAGES['command.options.schema.item'](invalidItem[0]),
            );
        }
      }

      if (permLevel > 0 && !isGuildOnly) {
        Debugger.warn(Constants.WARN_MESSAGES['command.permLevelAndIsGuildOnly']);
      }
    }

    super(addon, nameFromOptions === '' ? name : nameFromOptions, group);

    this.alias = alias;
    this.description = description;
    this.extendedDescription = extendedDescription;
    this.isNsfw = isNsfw;
    this.isGuildOnly = isGuildOnly;
    this.isSubcommand = isSubcommand;
    this.requiredPerms = requiredPerms;
    this.bucket = bucket;
    this.duration = duration;
    this.scope = scope;
    this.shouldDefaultToFirstSubcommand = shouldDefaultToFirstSubcommand;
    this.permLevel = permLevel;
    this.shouldPermLevelBeExact = shouldPermLevelBeExact;
    this.schema = schema;
    this.usage = new Discord.Collection();
    this._sweepInterval = null;
    this.subcommands = subcommands.map(Subcommand => {
      const subcommand = new Subcommand(this.addon, name, group);

      if (subcommand.shouldDefaultToFirstSubcommand && subcommand.subcommands[0].schema != null)
        throw new NebulaError(Constants.ERROR_MESSAGES['command.defaultSubcommand.schema']);

      return subcommand;
    });
  }

  /**
   * Whether the command is allowed to run outside of a guild
   * @param message The Nebula message wrapper
   */
  protected async allowGuildOnly(message: CommandMessage) {
    if (this.isGuildOnly && message.guild == null) return false;

    return true;
  }

  /**
   * Whether the command is allowed to run considering the limit usage
   * @param message The Nebula message wrapper
   */
  protected async allowUsage(message: CommandMessage) {
    if (this.duration === 0) return true;

    const currTime = Date.now();
    const id = this.scope === 'guild' ? message.guild.id : message.author.id;
    const usage = this.usage.get(id);

    if (usage) {
      const [bucket, time] = usage;

      if (currTime - time > this.duration) {
        this.usage.set(id, [1, currTime]);

        return true;
      }

      if (bucket === this.bucket) return false;

      this.usage.set(id, [bucket + 1, currTime]);
    } else {
      this.usage.set(id, [1, currTime]);

      if (!this._sweepInterval) {
        this._sweepInterval = setInterval(() => {
          this.usage.sweep(([, time]) => currTime - time > this.duration);

          if (this.usage.size === 0) {
            clearInterval(this._sweepInterval!);

            this._sweepInterval = null;
          }
        }, 30000);
      }
    }

    return true;
  }

  /**
   * Whether the command is allowed to run in a non-nsfw channel if marked nsfw
   * @param message The Nebula message wrapper
   */
  protected async allowNSFW(message: CommandMessage) {
    return !this.isNsfw || (message.channel as Discord.TextChannel).nsfw;
  }

  /**
   * Whether the command is allowed to run considering the permission levels
   * @param message The Nebula message wrapper
   */
  protected async allowPerm(message: CommandMessage) {
    const permissionLevel = this.permLevel;

    if (this.shouldPermLevelBeExact)
      return this.addon.permissions.checkExact(permissionLevel, message.message);

    return this.addon.permissions.check(permissionLevel, message.message);
  }

  /**
   * Invoke all the lifecycle methods
   * @param message The Nebula message wrapper
   * @param args The parsed user arguments
   */
  public async invokeLifecycles(message: CommandMessage, args: string[]) {
    const constructorName = this.constructor.name;

    // We have to use await on lifecycle methods for safety reasons
    // This allows right execution order and command editing to work
    if (this.willRun != null) {
      Debugger.info(`${constructorName} willRun`, 'Lifecycle');

      await this.willRun(message);
    }

    let shouldRun = true;

    if (this.shouldRun) {
      Debugger.info(`${constructorName} shouldRun`, 'Lifecycle');

      shouldRun = await this.shouldRun(message);
    }

    if (shouldRun !== undefined && !shouldRun) return;

    const allowGuildOnly = await this.allowGuildOnly(message);

    if (!allowGuildOnly) {
      Debugger.info(`${constructorName} inhibitGuildOnly`, 'Lifecycle');

      await this.inhibitGuildOnly(message);

      return;
    }

    const allowUsage = await this.allowUsage(message);

    if (!allowUsage) {
      Debugger.info(`${constructorName} inhibitUsage`, 'Lifecycle');

      await this.inhibitUsage(message);

      return;
    }

    const allowNSFW = await this.allowNSFW(message);

    if (!allowNSFW) {
      Debugger.info(`${constructorName} inhibitNSFW`, 'Lifecycle');

      await this.inhibitNSFW(message);

      return;
    }

    const allowPerm = await this.allowPerm(message);

    if (!allowPerm) {
      Debugger.info(`${constructorName} inhibitPerm`, 'Lifecycle');

      await this.inhibitPerm(message);

      return;
    }

    let validatedArgs;

    if (this.schema != null) {
      const results = this.addon.validator.validate(message.message, args, this.schema);
      const errors = Util.entriesOf(results).filter(([, result]) => Array.isArray(result)) as [
        string,
        ValidationError[],
      ][];

      if (errors.length) {
        Debugger.info(`${constructorName} catchValidationErrors`, 'Lifecycle');

        await this.catchValidationErrors(
          message,
          errors.reduce((res, [key, result]) => {
            res[key] = result;

            return res;
          }, {} as ValidationErrors),
        );

        return;
      }

      validatedArgs = results as ValidationResults;
    }

    if (this.run == null) return;

    let isSuccessfullyRun = true;
    let error;

    // Here we use try...catch statement to improve DX: This allows the devs to throw an error and
    // it would have the same effect as returning it for returning false
    try {
      Debugger.info(`${constructorName} run`, 'Lifecycle');

      const runResult = await this.run(message, validatedArgs);

      if (runResult instanceof Error || (runResult !== undefined && !runResult))
        isSuccessfullyRun = false;

      if (runResult instanceof Error) error = runResult;
    } catch (err) {
      Debugger.error(err);
      error = err;
      isSuccessfullyRun = false;
    }

    if (isSuccessfullyRun) {
      if (this.finalize) {
        Debugger.success(`${constructorName} finalize`, 'Lifecycle');

        await this.finalize(message);
      }
    } else if (this.fail) {
      Debugger.error(`${constructorName} fail`, 'Lifecycle');

      await this.fail(message, error);
    }
  }

  /**
   * Invoked after the command is inhibited due to it being used outside of a guild
   * @param message The Nebula message wrapper
   */
  protected async inhibitGuildOnly(message: CommandMessage) {
    message.send('This command cannot be used outside of a server');
  }

  /**
   * Invoked after the command is inhibited due to excess usage per user
   * @param message The Nebula message wrapper
   */
  protected async inhibitUsage(message: CommandMessage) {
    const id = this.scope === 'guild' ? message.guild.id : message.author.id;
    const timeLeft = (this.duration - (Date.now() - this.usage.get(id)![1])) / 1000;

    message.send(`You have ${timeLeft} seconds left before you can run this command again`);
  }

  /**
   * Invoked after the command is inhibited due to it being run in a non-nsfw channel
   * @param message The Nebula message wrapper
   */
  protected async inhibitNSFW(message: CommandMessage) {
    message.send('This command should only be sent in a NSFW channel');
  }

  /**
   * Invoked after the command is inhibited due to not enough permissions
   * @param message The Nebula message wrapper
   */
  protected async inhibitPerm(message: CommandMessage) {
    message.send('You are not allowed to run this command!');
  }

  /**
   * Invoked when the user arguments don't meet the validation schema
   * @param message The Nebula message wrapper
   * @param validationErrs The validation erros.
   */
  protected async catchValidationErrors(message: CommandMessage, validationErrs: ValidationErrors) {
    Object.values(validationErrs).forEach(errs => {
      errs.forEach(err => {
        message.send(err.message);
      });
    });
  }

  /**
   * Invoked when the command before the command runs
   * @param message The Nebula message wrapper
   */
  protected async willRun?(message: CommandMessage): Promise<void>;

  /**
   * Whether the command should run
   * @param message The Nebula message wrapper
   */
  protected async shouldRun?(message: CommandMessage): Promise<boolean>;

  /**
   * Invoked when the command runs
   * @param message The Nebula message wrapper
   * @param args The user arguments
   */
  protected async run?(
    message: CommandMessage,
    args?: ValidationResults,
  ): Promise<void | boolean | Error>;

  /**
   * Invoked when the command successfully runs
   * @param message The Nebula message wrapper
   */
  protected async finalize?(message: CommandMessage): Promise<void>;

  /**
   * Invoked when the command failed to run
   * @param message The Nebula message wrapper
   * @param error The invoking error
   */
  protected async fail?(message: CommandMessage, error?: Error): Promise<void>;
}
