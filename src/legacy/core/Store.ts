import L from '@botbind/lyra';
import fs from 'fs';
import path from 'path';
import Addon from './Addon';
import Command from './Command';
import Task from './Task';
import Monitor from './Monitor';
import Event from './Event';
import Language from './Language';
import Resource from './Resource';

/**
 * The types of resources.
 */
export type ResourceTypes = 'commands' | 'tasks' | 'monitors' | 'events' | 'languages';

/**
 * The folders that will be loaded for resources.
 */
export type FolderNames = { [K in ResourceTypes]?: string };

/**
 * The options for the store.
 */
export interface StoreOptions {
  /**
   * The addon of the store.
   */
  addon: Addon;

  /**
   * The base directory of the addon.
   */
  baseDir?: string;

  /**
   * Whether resource folders should be created if not exist.
   */
  createFolders?: boolean;

  /**
   * The folder whose name shouldn't be used as the group name.
   */
  ignoreGroupFolderName?: string;

  /**
   * The folder names mapping.
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

export default class Store extends Map<ResourceTypes, Resource[]> {
  /**
   * The addon of the store.
   */
  addon: Addon;

  /**
   * The base directory of the addon.
   */
  baseDir: string;

  /**
   * Whether resource folders should be created if not exist.
   */
  createFolders: boolean;

  /**
   * The folder whose name shouldn't be used as the group name.
   */
  ignoreGroupFolderName: string;

  /**
   * The folder names mapping.
   */
  folderNames: Required<FolderNames>;

  /**
   * The store of all Nebula resources.
   * @param addon The addon of the store.
   */
  constructor(options: StoreOptions) {
    const result = L.object({
      addon: L.object()
        .instance(Addon)
        .required(),
      baseDir: L.string().default(process.cwd()),
      folderNames: L.object({
        commands: L.string().default('commands'),
        tasks: L.string().default('tasks'),
        monitors: L.string().default('monitors'),
        events: L.string().default('events'),
        languages: L.string().default('languages'),
      }).default({
        commands: 'commands',
        tasks: 'tasks',
        monitors: 'monitors',
        events: 'events',
        languages: 'languages',
      }),
      createFolders: L.boolean().default(true),
      ignoreGroupFolderName: L.string().default('ignore'),
    })
      .label('Store options')
      .validate(options);

    if (result.errors !== null) throw result.errors[0];

    const { addon, baseDir, folderNames, createFolders, ignoreGroupFolderName } = result.value;

    super();

    this.addon = addon as Addon;
    this.baseDir = baseDir;
    this.folderNames = folderNames;
    this.createFolders = createFolders;
    this.ignoreGroupFolderName = ignoreGroupFolderName;

    this.set('commands', [])
      .set('tasks', [])
      .set('monitors', [])
      .set('events', [])
      .set('languages', []);
  }

  /**
   * The loaded commands of the store.
   */
  get commands() {
    return this.get('commands') as Command[];
  }

  /**
   * The loaded tasks of the store.
   */
  get tasks() {
    return this.get('tasks') as Task[];
  }

  /**
   * The loaded monitors of the store.
   */
  get monitors() {
    return this.get('monitors') as Monitor[];
  }

  /**
   * The loaded events of the store.
   */
  get events() {
    return this.get('events') as Event[];
  }

  /**
   * The loaded languages of the store.
   */
  get languages() {
    return this.get('languages') as Language[];
  }

  /**
   * Load all the available and valid resources under the base directory.
   */
  load() {
    Object.entries(this.folderNames).forEach(([type, folderName]) => {
      const typePath = path.resolve(this.baseDir, folderName);

      if (!fs.existsSync(typePath)) {
        if (this.createFolders) fs.mkdirSync(typePath);

        return;
      }

      fs.readdirSync(typePath).forEach(groupName => {
        const groupPath = path.resolve(typePath, groupName);

        if (fs.lstatSync(groupPath).isDirectory()) {
          const actualGroupName =
            groupName === this.ignoreGroupFolderName ? '__NEBULA_IGNORE__' : groupName;

          fs.readdirSync(groupPath).forEach(resourceName => {
            const resourcePath = path.resolve(groupPath, resourceName);

            this._import(resourcePath, type as ResourceTypes, actualGroupName);
          });

          return;
        }

        this._import(groupPath, type as ResourceTypes, '__NEBULA_IGNORE__');
      });
    });
  }

  _import(dir: string, type: ResourceTypes, groupName: string) {
    const ext = path.extname(dir);

    // Support loading js and ts files
    if (fs.lstatSync(dir).isFile() && (ext === '.js' || ext === '.ts')) {
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const resourceReq = require(dir);

      // InteropRequiredDefault
      const LoadedResource = resourceReq.__esModule ? resourceReq.default : resourceReq;

      if (LoadedResource.prototype instanceof structureMapping[type]) {
        const resource = new LoadedResource({
          addon: this.addon,
          filename: path.basename(dir, ext),
          group: groupName,
        }) as Resource;

        // Do not load subcommands
        if (type === 'commands' && (resource as Command).isSubcommand) return;

        this.get(type)!.push(resource);
      }
    }
  }
}

export interface StoreConstructor {
  new (options: StoreOptions): Store;
}
