import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import Client from './Client';
import Task from './resource/Task';
import Command from './resource/Command';
import { AddonOptions, ResourceList, Resource, Constructor, CommandComponents } from '../types';

const defaultOptions = {
  folderName: {
    commands: 'commands',
    tasks: 'tasks',
  },
  createFoldersIfNotExisted: true,
  ignoreGroupFolderName: 'ignore',
  validator: {
    coerce: true,
    abortEarly: true,
  },
};

export default abstract class Addon {
  protected client: Client;
  public readonly name: string;
  public readonly options: Omit<AddonOptions & typeof defaultOptions, 'name'>;
  public readonly resources: ResourceList;

  constructor(client: Client, options: AddonOptions) {
    if (!isPlainObject(options)) throw new TypeError('addonOptions must be an object');

    const { name, ...rest } = merge({}, defaultOptions, options);

    this.client = client;
    this.name = name;
    this.options = rest;
    this.resources = [];
  }

  public loadResources() {
    Object.entries(this.options.folderName).forEach(([category, categoryAlias]) => {
      const typedCategoryAlias = categoryAlias as string;
      const categoryPath = path.resolve(this.options.baseDir, typedCategoryAlias);

      if (!fs.existsSync(categoryPath) && this.options.createFoldersIfNotExisted)
        fs.mkdirSync(categoryPath);

      fs.readdirSync(categoryPath).forEach(groupName => {
        const groupPath = path.resolve(categoryPath, groupName);

        if (fs.lstatSync(groupPath).isDirectory()) {
          const actualGroupName =
            groupName === this.options.ignoreGroupFolderName ? 'nebula-ignore' : groupName;

          fs.readdirSync(groupPath).forEach(resourceName => {
            const resourcePath = path.resolve(groupPath, resourceName);

            this.loadResource(resourcePath, category, actualGroupName);
          });

          return;
        }

        this.loadResource(groupPath, category, 'nebula-ignore');
      });
    });
  }

  private loadResource(path: string, category: string, group: string) {
    if (fs.lstatSync(path).isFile() && (path.endsWith('.js') || path.endsWith('.ts'))) {
      const resourceReq = require(path);

      const Resource: Constructor<Resource> = resourceReq.default || resourceReq;

      if (Resource.prototype instanceof Command || Resource.prototype instanceof Task) {
        const resource = new Resource(this.client);

        this.resources.push({
          resource,
          category,
          group,
        });
      }
    }
  }

  public dispatch(message: Discord.Message) {
    const [prefix, commandName, commandArgs] = Addon.parseCommand(message.content);

    if (message.author.bot || prefix !== this.client.options.prefix) return;

    const commands = this.resources.filter(
      ({ category, resource }) =>
        category === 'commands' &&
        (resource.name === commandName || resource.options.alias.includes(commandName)),
    );

    commands.forEach(({ resource }) => {
      const shouldDispatch: boolean | undefined = this.client.callLifecycle(
        'willDispatch',
        resource,
        message,
      );

      if (shouldDispatch !== undefined && !shouldDispatch) return;

      const validatedArgs = [];

      if (resource.options.schema) {
        for (let i = 0; i < resource.options.schema.length; i += 1) {
          const [errors, validatedValue] = resource.options.schema[i].validate(
            commandArgs[i],
            this.options.validator,
          );

          if (errors) {
            this.client.callLifecycle('didCatchValidationError', resource, message, errors);

            return;
          }

          validatedArgs.push(validatedValue);
        }
      }

      const isSuccessfullyDispatched = this.client.callLifecycle('didDispatch', resource, message);

      if (isSuccessfullyDispatched !== undefined && !isSuccessfullyDispatched) {
        this.client.callLifecycle('didFailedDispatch', resource, message);

        return;
      }

      this.client.callLifecycle('didSuccessfulDispatch', resource, message);
    });
  }

  protected static parseCommand(content: string): CommandComponents {
    const [commandName, ...commandArgs] = content
      .substring(1, content.length)
      .trim()
      .split(/ +/g);

    return [content.substring(0, 1), commandName, commandArgs];
  }

  public didReady?(): void;
}
