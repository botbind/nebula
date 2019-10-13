import fs from 'fs';
import path from 'path';
import merge from 'lodash.merge';
import Addon from './Addon';
import Command from './Command';
import Task from './Task';
import Util from './Util';
import NebulaError from './NebulaError';
import { Constructor, MakeOptsOptional } from './types';

export interface FolderNames {
  /**
   * The folder that will be loaded for commands
   */
  commands?: string;

  /**
   * The folder that will be loaded for tasks
   */
  tasks?: string;
}

/**
 * The options for the store
 */
export interface StoreOptions {
  /**
   * The base directory of the addon
   */
  baseDir: string;

  /**
   * The folder names mapping
   */
  folderNames: Required<FolderNames>;

  /**
   * Whether resource folders should be created if not exist
   */
  createFoldersIfNotExisted: boolean;

  /**
   * The folder whose name shouldn't be used as the group name
   */
  ignoreGroupFolderName: string;
}

/**
 * The options passed as argument for the store
 */
export type StoreOptionsArg = Partial<MakeOptsOptional<StoreOptions, 'folderNames'>>;

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

const defaultOptions: StoreOptions = {
  baseDir: process.cwd(),
  folderNames: {
    commands: 'commands',
    tasks: 'tasks',
  },
  createFoldersIfNotExisted: true,
  ignoreGroupFolderName: 'ignore',
};

export default class Store extends Array<ResourceInfo> {
  /**
   * The addon of the store
   */
  protected addon: Addon;

  /**
   * The options for the store
   */
  readonly options: StoreOptions;

  /**
   * The store of all Nebula resources
   * @param addon The addon of the store
   */
  constructor(addon: Addon, options: StoreOptionsArg = {}) {
    if (!Util.isObject(options)) throw new NebulaError('The options for Store must be an object');

    super(0);

    this.addon = addon;
    this.options = merge({}, defaultOptions, options);
  }

  /**
   * Load all the available and valid resources under the base directory
   */
  load() {
    Util.entriesOf(this.options.folderNames).forEach(([category, categoryAlias]) => {
      const categoryPath = path.resolve(this.options.baseDir, categoryAlias);

      if (!fs.existsSync(categoryPath) && this.options.createFoldersIfNotExisted)
        fs.mkdirSync(categoryPath);

      fs.readdirSync(categoryPath).forEach(groupName => {
        const groupPath = path.resolve(categoryPath, groupName);

        if (fs.lstatSync(groupPath).isDirectory()) {
          const actualGroupName =
            groupName === this.options.ignoreGroupFolderName ? 'nebula-ignore' : groupName;

          fs.readdirSync(groupPath).forEach(resourceName => {
            const resourcePath = path.resolve(groupPath, resourceName);

            this._import(resourcePath, category, actualGroupName);
          });
          return;
        }

        this._import(groupPath, category, 'nebula-ignore');
      });
    });
  }

  private _import(path: string, category: string, group: string) {
    if (fs.lstatSync(path).isFile() && (path.endsWith('.js') || path.endsWith('.ts'))) {
      const resourceReq = require(path);

      const Resource: Constructor<Resource> = resourceReq.default || resourceReq;

      if (Resource.prototype instanceof Command || Resource.prototype instanceof Task) {
        const resource = new Resource(this.addon);

        // Do not load subcommands
        if (resource.options.isSubcommand) return;

        this.push({
          resource,
          category,
          group,
        });
      }
    }
  }
}
