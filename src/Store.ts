import fs from 'fs';
import path from 'path';
import merge from 'lodash.merge';
import Addon from './Addon';
import Command from './Command';
import Task from './Task';
import Monitor from './Monitor';
import Util from './Util';
import NebulaError from './NebulaError';
import { Constructor } from './types';

export type StoreTypes = 'commands' | 'tasks' | 'monitors';

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
   * The name of the folder containing the resources
   */
  folderName: string;

  /**
   * The type of the store
   */
  type: StoreTypes;
}

/**
 * The options for the store
 */
export type StoreOptions = Required<OptionalStoreOptions>;

/**
 * Available and valid resource
 */
export type Resource = Command & Task & Monitor;

/**
 * The information of a resource
 */
export interface ResourceInfo {
  /**
   * The resource
   */
  resource: Resource;

  /**
   * The group of the resource
   */
  group: string;
}

const storeTypes = ['commands', 'tasks', 'monitors'];

const defaultOptions: StoreOptions = {
  baseDir: process.cwd(),
  createFoldersIfNotExisted: true,
  ignoreGroupFolderName: 'ignore',
  folderName: '',
  type: 'commands',
};

export default class Store extends Array<ResourceInfo> {
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
   * @param options The options for the store
   */
  constructor(addon: Addon, options: OptionalStoreOptions) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the store must be an object');

    if (options.folderName == null)
      throw new Error('The folder name for the store must be specified');

    if (options.type == null) throw new Error('The type of the store must be specified');

    if (!storeTypes.includes(options.type))
      throw new Error('The type of the store must be commands, tasks or monitors');

    super(0);

    this.addon = addon;
    this.options = merge({}, defaultOptions, options);
  }

  /**
   * Load all the available and valid resources under the base directory
   */
  public load() {
    const typePath = path.resolve(this.options.baseDir, this.options.folderName);

    if (!fs.existsSync(typePath) && this.options.createFoldersIfNotExisted) fs.mkdirSync(typePath);

    fs.readdirSync(typePath).forEach(groupName => {
      const groupPath = path.resolve(typePath, groupName);

      if (fs.lstatSync(groupPath).isDirectory()) {
        const actualGroupName =
          groupName === this.options.ignoreGroupFolderName ? 'nebula-ignore' : groupName;

        fs.readdirSync(groupPath).forEach(resourceName => {
          const resourcePath = path.resolve(groupPath, resourceName);

          this._import(resourcePath, actualGroupName);
        });
        return;
      }

      this._import(groupPath, 'nebula-ignore');
    });
  }

  private _import(dir: string, group: string) {
    if (fs.lstatSync(dir).isFile() && (dir.endsWith('.js') || dir.endsWith('.ts'))) {
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const resourceReq = require(dir);

      const Resource: Constructor<Resource> = resourceReq.default || resourceReq;

      let condition = Resource.prototype instanceof Command;

      switch (this.options.type) {
        case 'tasks':
          condition = Resource.prototype instanceof Task;
          break;
        case 'monitors':
          condition = Resource.prototype instanceof Monitor;
          break;
        default:
      }

      if (!condition) return;

      const resource = new Resource(this.addon);

      // Do not load subcommands
      if (resource.options.isSubcommand) return;

      if (resource.didReady) resource.didReady();

      this.push({
        resource,
        group,
      });
    }
  }
}
