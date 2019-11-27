import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import Addon from './Addon';
import Command from './Command';
import Task from './Task';
import Monitor from './Monitor';
import Event from './Event';
import Language from './Language';
import Resource from './Resource';
import Util from './Util';
import NebulaError from './NebulaError';
import * as Constants from './constants';
import { Constructor } from './types';

/**
 * The types of resources
 */
export type ResourceTypes = 'commands' | 'tasks' | 'monitors' | 'events' | 'languages';

/**
 * The folders that will be loaded for resources
 */
export type FolderNames = { [key in ResourceTypes]?: string };

/**
 * The options for the store
 */
export interface StoreOptions {
  /**
   * The base directory of the addon
   */
  baseDir?: string;

  /**
   * Whether resource folders should be created if not exist
   */
  shouldCreateFolders?: boolean;

  /**
   * The folder whose name shouldn't be used as the group name
   */
  ignoreGroupFolderName?: string;

  /**
   * The folder names mapping
   */
  folderNames?: FolderNames;
}

const structureMapping = {
  commands: Command,
  tasks: Task,
  monitors: Monitor,
  events: Event,
  languages: Language,
};

export default class Store extends Discord.Collection<ResourceTypes, Resource[]> {
  /**
   * The addon of the store
   */
  protected addon: Addon;

  /**
   * The base directory of the addon
   */
  public baseDir: string;

  /**
   * Whether resource folders should be created if not exist
   */
  public shouldCreateFolders: boolean;

  /**
   * The folder whose name shouldn't be used as the group name
   */
  public ignoreGroupFolderName: string;

  /**
   * The folder names mapping
   */
  public folderNames: Required<FolderNames>;

  /**
   * The store of all Nebula resources
   * @param addon The addon of the store
   */
  constructor(addon: Addon, options: StoreOptions = {}) {
    if (Constants.IS_DEV && !Util.isObject(options))
      throw new NebulaError(Constants.ERROR_MESSAGES['store.options']);

    const {
      baseDir = process.cwd(),
      folderNames = {
        commands: 'commands',
        tasks: 'tasks',
        monitors: 'monitors',
        events: 'events',
        languages: 'languages',
      },
      shouldCreateFolders = true,
      ignoreGroupFolderName = 'ignore',
    } = options;

    if (Constants.IS_DEV) {
      if (typeof baseDir !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['store.options.baseDir']);

      if (!Util.isObject(folderNames))
        throw new NebulaError(Constants.ERROR_MESSAGES['store.options.folderNames']);

      if (typeof shouldCreateFolders !== 'boolean')
        throw new NebulaError(Constants.ERROR_MESSAGES['store.options.shouldCreateFolders']);

      if (typeof ignoreGroupFolderName !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['store.options.ignoreGroupFolderName']);
    }

    super();

    this.addon = addon;
    this.baseDir = baseDir;
    this.folderNames = folderNames as Required<FolderNames>;
    this.shouldCreateFolders = shouldCreateFolders;
    this.ignoreGroupFolderName = ignoreGroupFolderName;

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
    Util.entriesOf(this.folderNames).forEach(([type, folderName]) => {
      const typePath = path.resolve(this.baseDir, folderName);

      if (!fs.existsSync(typePath)) {
        if (this.shouldCreateFolders) fs.mkdirSync(typePath);
        else return;
      }

      fs.readdirSync(typePath).forEach(groupName => {
        const groupPath = path.resolve(typePath, groupName);

        if (fs.lstatSync(groupPath).isDirectory()) {
          const actualGroupName =
            groupName === this.ignoreGroupFolderName ? 'nebula-ignore' : groupName;

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

  private _import(dir: string, type: ResourceTypes, groupName: string) {
    // Support loading js and ts files
    if (fs.lstatSync(dir).isFile() && (dir.endsWith('.js') || dir.endsWith('.ts'))) {
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const resourceReq = require(dir);

      const LoadedResource: Constructor<Resource> = resourceReq.default || resourceReq;

      if (LoadedResource.prototype instanceof structureMapping[type]) {
        const resource = new LoadedResource(
          this.addon,
          path.basename(dir, path.extname(dir)),
          groupName,
        );

        // Do not load subcommands
        if (type === 'commands' && (resource as Command).isSubcommand) return;

        this.get(type)!.push(resource);
      }
    }
  }
}
