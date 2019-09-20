import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import Client from './Client';
import Task from './Task';
import Command from './Command';
import Debugger from './Debugger';
import {
  AddonOptions,
  ResourceList,
  Resource,
  Constructor,
  CommandComponents,
  GuildSettings,
} from '../types';

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
  private guildSettings: GuildSettings;
  public readonly name: string;
  public readonly options: Omit<AddonOptions & typeof defaultOptions, 'name'>;
  public readonly resources: ResourceList;

  constructor(client: Client, guildSettings: GuildSettings, options: AddonOptions) {
    if (!isPlainObject(options)) throw new TypeError('addonOptions must be an object');

    const { name, ...rest } = merge(defaultOptions, options);

    this.client = client;
    this.guildSettings = guildSettings;
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

    if (this.client.options.debug) Debugger.info('Addon afterResourcesLoaded', 'Lifecycle');
    if (this.afterResourcesLoaded) this.afterResourcesLoaded();
  }

  private static isResourceLoadable(path: string) {
    return fs.lstatSync(path).isFile() && (path.endsWith('.js') || path.endsWith('.ts'));
  }

  private loadResource(path: string) {
    const resourceReq = require(path);

    const Resource: Constructor<Resource> = resourceReq.default || resourceReq;

    if (!(Resource.prototype instanceof Command || Resource.prototype instanceof Task)) return;

    const resource = new Resource(this.client);

    if (this.client.options.debug) Debugger.info(`${resource.name} loaded`, 'Lifecycle');
    if (resource.loaded) resource.loaded();

    return resource;
  }

  public dispatch(message: Discord.Message) {
    const [prefix, commandName, commandArgs] = Addon.parseCommand(message.content);

    if (message.author.bot || prefix !== this.guildSettings.prefix) return;

    const commands = this.resources.filter(
      ({ category, resource }) =>
        category === 'commands' &&
        (resource.name === commandName || resource.options.alias.includes(commandName)),
    );

    commands.forEach(command => {
      if (command.resource.shouldCommandReady && !command.resource.shouldCommandReady(message))
        return;

      command.resource.ready(message);
    });
  }

  protected static parseCommand(content: string): CommandComponents {
    const [commandName, ...commandArgs] = content
      .substring(1, content.length)
      .trim()
      .split(/ +/g);

    return [content.substring(0, 1), commandName, commandArgs];
  }

  public ready?(): void;
  public loaded?(): void;
  protected afterResourcesLoaded?(): void;
}
