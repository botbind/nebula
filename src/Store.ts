import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Command from './Command';
import Task from './Task';
import Monitor from './Monitor';
import Event from './Event';
import Language from './Language';
import NebulaResource from './Resource';
import Util from './Util';
import NebulaError from './NebulaError';
import { Constructor } from './types';

/**
 * The types of resources
 */
export type ResourceTypes = 'commands' | 'tasks' | 'monitors' | 'events' | 'languages';

/**
 * The folders that will be loaded for resources
 */
export type FolderNames = Partial<Record<ResourceTypes, string>>;

/**
 * The optional options passed as arguments to the store
 */
export interface OptionalStoreOptions {
  /**
   * The base directory of the addon
   */
  baseDir?: string;

  /**
   * Whether resource folders should be created if not exist
   */
  createFoldersIfNotExisted?: boolean;

  /**
   * The folder whose name shouldn't be used as the group name
   */
  ignoreGroupFolderName?: string;

  /**
   * The folder names mapping
   */
  folderNames?: FolderNames;
}

/**
 * The options for the store
 */
export interface StoreOptions extends Required<OptionalStoreOptions> {
  folderNames: Required<FolderNames>;
}

const structureMapping = {
  commands: Command,
  tasks: Task,
  monitors: Monitor,
  events: Event,
  languages: Language,
};

const defaultOptions: StoreOptions = {
  baseDir: process.cwd(),
  folderNames: {
    commands: 'commands',
    tasks: 'tasks',
    monitors: 'monitors',
    events: 'events',
    languages: 'languages',
  },
  createFoldersIfNotExisted: true,
  ignoreGroupFolderName: 'ignore',
};

export default class Store extends Discord.Collection<ResourceTypes, NebulaResource[]> {
  /**
   * The addon of the store
   */
  protected addon: Addon;

  /**
   * The options for the store
   */
  public options: StoreOptions;

  /**
   * The store of all Nebula resources
   * @param addon The addon of the store
   */
  constructor(addon: Addon, options: OptionalStoreOptions = {}) {
    if (!Util.isObject(options)) throw new NebulaError('The options for Store must be an object');

    super();

    this.addon = addon;
    this.options = merge({}, defaultOptions, options);

    this.set('commands', [])
      .set('tasks', [])
      .set('monitors', [])
      .set('events', [])
      .set('languages', []);
  }

  /**
   * The loaded commands of the store
   */
  get commands() {
    return this.get('commands') as Command[];
  }

  /**
   * The loaded tasks of the store
   */
  get tasks() {
    return this.get('tasks') as Task[];
  }

  /**
   * The loaded monitors of the store
   */
  get monitors() {
    return this.get('monitors') as Monitor[];
  }

  /**
   * The loaded events of the store
   */
  get events() {
    return this.get('events') as Event[];
  }

  /**
   * The loaded languages of the store
   */
  get languages() {
    return this.get('languages') as Language[];
  }

  /**
   * Load all the available and valid resources under the base directory
   */
  public load() {
    Util.entriesOf(this.options.folderNames).forEach(([type, folderName]) => {
      const typePath = path.resolve(this.options.baseDir, folderName);

      if (!fs.existsSync(typePath) && this.options.createFoldersIfNotExisted)
        fs.mkdirSync(typePath);

      fs.readdirSync(typePath).forEach(groupName => {
        const groupPath = path.resolve(typePath, groupName);

        if (fs.lstatSync(groupPath).isDirectory()) {
          const actualGroupName =
            groupName === this.options.ignoreGroupFolderName ? 'nebula-ignore' : groupName;

          fs.readdirSync(groupPath).forEach(resourceName => {
            const resourcePath = path.resolve(groupPath, resourceName);

            this._import(resourcePath, type, actualGroupName);
          });
          return;
        }

        this._import(groupPath, type, 'nebula-ignore');
      });
    });
  }

  private _import(dir: string, type: ResourceTypes, group: string) {
    if (fs.lstatSync(dir).isFile() && (dir.endsWith('.js') || dir.endsWith('.ts'))) {
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const resourceReq = require(dir);

      const Resource: Constructor<NebulaResource> = resourceReq.default || resourceReq;

      if (Resource.prototype instanceof structureMapping[type]) {
        const resource = new Resource(this.addon);

        resource.group = group;

        // Do not load subcommands
        if (type === 'commands' && (resource as Command).options.isSubcommand) return;

        if (resource.didReady) resource.didReady();

        this.get(type)!.push(resource);
      }
    }
  }
}
