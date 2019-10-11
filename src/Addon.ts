import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import merge from 'lodash.merge';
import Client from './Client';
import Util from './Util';
import Command from './Command';
import Task from './Task';
import NebulaError from './NebulaError';
import Validator, { ValidatorOptions, ValidationResults } from './Validator';
import { Constructor, MakeOptional } from './types';

export interface FolderNames {
  /**
   * The folder that will be loaded for commands
   */
  commands: string;
  /**
   * The folder that will be loaded for tasks
   */
  tasks: string;
}

export interface AddonOptions {
  /**
   * The name of the addon
   */
  name: string;

  /**
   * The base directory of the addon
   */
  baseDir: string;

  /**
   * The folder names mapping
   */
  folderNames: FolderNames;

  /**
   * Whether resource folders should be created if not exist
   */
  createFoldersIfNotExisted: boolean;

  /**
   * The folder whose name shouldn't be used as the group name
   */
  ignoreGroupFolderName: string;

  /**
   * The options of the validator
   */
  validatorOptions: Partial<ValidatorOptions>;
}

/**
 * Available and valid resource
 */
export type Resource = Command & Task;

/**
 * The info of the resources
 */
export interface ResourceInfo {
  resource: Resource;
  group: string;
  category: string;
}

/**
 * A collection of resources
 */
export type ResourceList = ResourceInfo[];

/**
 * The components of a commands, including 3 parts: prefix, name and arguments
 */
export type CommandComponents = [string, string, string[]];

export default abstract class Addon {
  /**
   * The client of the addon
   */
  protected client: Client;

  /**
   * The name of the addon
   */
  readonly name: string;

  /**
   * The options of the addon
   */
  readonly options: Omit<AddonOptions, 'name'>;

  /**
   * The loaded resources of the addon
   */
  readonly resources: ResourceList;

  /**
   * Invoked when the addon becomes ready to start working
   */
  didReady?(): void;

  /**
   * Invoked when the command name doesn't resolve to any commands
   */
  didResolveCommandsUnsuccessfully(message: Discord.Message, name: string, parent?: string) {
    message.channel.send(
      `Cannot find command "${name}" from ${this.name} ${parent ? `of parent ${parent}` : ''}`,
    );
  }

  /**
   * The main hub for creating addons
   * @param client The client of the addon
   * @param options The options of the addon
   */
  constructor(
    client: Client,
    options: MakeOptional<
      AddonOptions,
      'folderNames' | 'createFoldersIfNotExisted' | 'ignoreGroupFolderName' | 'validatorOptions'
    >,
  ) {
    if (!Util.isObject(options)) throw new NebulaError('addonOptions must be an object');

    const { name, ...otherOptions } = merge(
      {
        folderNames: {
          commands: 'commands',
          tasks: 'tasks',
        },
        createFoldersIfNotExisted: true,
        ignoreGroupFolderName: 'ignore',
        validatorOptions: {
          coerce: true,
          abortEarly: true,
        },
      },
      options,
    );

    this.client = client;
    this.name = name;
    this.options = otherOptions;
    this.resources = [];
  }

  /**
   * Load all the available and valid resources under the base directory
   */
  loadResources() {
    Object.entries(this.options.folderNames).forEach(([category, categoryAlias]) => {
      const categoryPath = path.resolve(this.options.baseDir, categoryAlias as string);

      if (!fs.existsSync(categoryPath) && this.options.createFoldersIfNotExisted)
        fs.mkdirSync(categoryPath);

      fs.readdirSync(categoryPath).forEach(groupName => {
        const groupPath = path.resolve(categoryPath, groupName);

        if (fs.lstatSync(groupPath).isDirectory()) {
          const actualGroupName =
            groupName === this.options.ignoreGroupFolderName ? 'nebula-ignore' : groupName;

          fs.readdirSync(groupPath).forEach(resourceName => {
            const resourcePath = path.resolve(groupPath, resourceName);

            this._importResource(resourcePath, category, actualGroupName);
          });

          return;
        }

        this._importResource(groupPath, category, 'nebula-ignore');
      });
    });
  }

  private _importResource(path: string, category: string, group: string) {
    if (fs.lstatSync(path).isFile() && (path.endsWith('.js') || path.endsWith('.ts'))) {
      const resourceReq = require(path);

      const Resource: Constructor<Resource> = resourceReq.default || resourceReq;

      if (Resource.prototype instanceof Command || Resource.prototype instanceof Task) {
        const resource = new Resource(this.client);

        // Do not load subcommands
        if (resource.options.isSubcommand) return;

        this.resources.push({
          resource,
          category,
          group,
        });
      }
    }
  }

  /**
   * Dispatch commands based on messages.
   * @param message The created message
   */
  async dispatch(message: Discord.Message, commandComponents: CommandComponents) {
    const [, commandName, commandArgs] = commandComponents;

    // We allow multiple commands to be ran at the same time
    const commands = this.resources.filter(
      ({ category, resource }) =>
        category === 'commands' &&
        (resource.name === commandName || resource.alias.includes(commandName)),
    );

    if (!commands.length) {
      if (this.didResolveCommandsUnsuccessfully)
        this.didResolveCommandsUnsuccessfully(message, commandName);

      return;
    }

    for (const { resource } of commands)
      this._dispatchCommandsRecursively(resource, message, commandArgs);
  }

  private async _dispatchCommandsRecursively(
    command: Command,
    message: Discord.Message,
    args: string[],
  ) {
    if (command.instantiatedSubcommands) {
      const [subcommandName, ...rest] = args;

      if (!subcommandName && command.options.subcommands!.defaultToFirst) {
        const defaultSubcommand = command.instantiatedSubcommands[0];

        if (defaultSubcommand.options.schema)
          throw new Error('Default subcommands must not have schema');

        this._dispatchCommandsRecursively(command.instantiatedSubcommands[0], message, rest);

        return;
      }

      const subcommand = command.instantiatedSubcommands.find(
        command => command.name === subcommandName || command.alias.includes(subcommandName),
      );

      if (!subcommand) {
        this.didResolveCommandsUnsuccessfully(message, subcommandName || '', command.name);

        return;
      }

      this._dispatchCommandsRecursively(subcommand, message, rest);
    } else {
      let willDispatch;

      if (command.willDispatch) willDispatch = await command.willDispatch(message);

      if (willDispatch !== undefined && !willDispatch) return;

      if (command.shouldCooldown(message)) {
        command.didCooldown(message);

        return;
      }

      if (command.shouldInhibitNSFW(message)) {
        command.didInhibitNSFW(message);

        return;
      }

      let validatedArgs;

      if (command.options.schema) {
        if (!Util.isObject(command.options.schema))
          throw new NebulaError('schema must be an object with validators');

        const results = Validator.validate(message, args, command.options.schema, this.options
          .validatorOptions as ValidatorOptions);

        const errors = Object.entries(results).filter(([, results]) => Util.isArray(results));

        if (errors.length) {
          command.didCatchValidationErrors(
            message,
            errors.reduce(
              (res, [key, result]) => {
                res[key] = result;

                return res;
              },
              {} as ValidationResults,
            ),
          );

          return;
        }

        validatedArgs = results;
      }

      if (!command.didDispatch) return;

      const isSuccessfullyDispatched = await command.didDispatch(message, validatedArgs);

      if (isSuccessfullyDispatched !== undefined && !isSuccessfullyDispatched) {
        if (command.didDispatchUnsuccessfully) command.didDispatchUnsuccessfully(message);

        return;
      }

      if (command.didDispatchSuccessfully) command.didDispatchSuccessfully(message);
    }
  }

  /**
   * Parse a message content and return the command prefix, name and arguments
   * @param content The message content
   */
  parseCommand(content: string): CommandComponents {
    const [commandName, ...commandArgs] = content
      .substring(1, content.length)
      .trim()
      .split(/ +/g);

    return [content.substring(0, 1), commandName, commandArgs];
  }
}
