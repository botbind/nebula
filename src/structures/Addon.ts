import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import Client from './Client';
import Task from './Task';
import Command from './Command';
import Debugger from './Debugger';
import ValidationError from './ValidationError';
import { AddonOptions, ResourceList, Resource, Constructor, CommandComponents } from '../types';

const defaultOptions = {
  folderName: {
    commands: 'commands',
    tasks: 'tasks',
  },
  createFoldersIfNotExisted: true,
  ignoreGroupFolderName: 'ignore',
};

export default abstract class Addon {
  protected client: Client;
  public readonly name: string;
  public readonly options: Omit<AddonOptions & typeof defaultOptions, 'name'>;
  public readonly resources: ResourceList;

  constructor(client: Client, options: AddonOptions) {
    if (!isPlainObject(options)) throw new TypeError('addonOptions must be an object');

    const { name, ...rest } = merge(defaultOptions, options);

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

            if (Addon.isResourceLoadable(resourcePath)) {
              const resource = this.loadResource(resourcePath);

              if (!resource) return;

              this.resources.push({
                resource,
                category,
                group: actualGroupName,
              });
            }
          });
        } else if (Addon.isResourceLoadable(groupPath)) {
          const resource = this.loadResource(groupPath);

          if (!resource) return;

          this.resources.push({
            resource,
            category,
            group: 'nebula-ignore',
          });
        }
      });
    });
  }

  private static isResourceLoadable(path: string) {
    return fs.lstatSync(path).isFile() && (path.endsWith('.js') || path.endsWith('.ts'));
  }

  private loadResource(path: string) {
    const resourceReq = require(path);

    const Resource: Constructor<Resource> = resourceReq.default || resourceReq;

    if (!(Resource.prototype instanceof Command || Resource.prototype instanceof Task)) return;

    const resource = new Resource(this.client);

    if (this.client.options.debug) Debugger.info(`${resource.name} didLoad`, 'Lifecycle');
    if (resource.didLoad) resource.didLoad();

    return resource;
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
      if (this.client.options.debug) Debugger.info(`${resource.name} willDispatch`, 'Lifecycle');
      if (resource.willDispatch) resource.willDispatch(message);

      if (this.client.options.debug)
        Debugger.info(`${resource.name} shouldCommandDispatch`, 'Lifecycle');
      if (resource.shouldCommandDispatch && !resource.shouldCommandDispatch(message)) return;

      const validatedArgs = [];

      if (resource.options.schema) {
        for (let i = 0; i < resource.options.schema.length; i += 1) {
          const [errors, validatedValue] = resource.options.schema[i](commandArgs[i]);

          if (errors && resource.didCatchValidationError) {
            if (this.client.options.debug)
              Debugger.info(`${resource.name} didCatchValidationError`, 'Lifecycle');
            resource.didCatchValidationError(message, errors);

            return;
          }

          validatedArgs.push(validatedValue as string | number | boolean);
        }
      }

      if (this.client.options.debug) Debugger.info(`${resource.name} didDispatch`, 'Lifecycle');
      resource.didDispatch(message, validatedArgs);
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
  public didLoad?(): void;
}
