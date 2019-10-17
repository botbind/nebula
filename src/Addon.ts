import Client from './Client';
import NebulaCommandStore from './CommandStore';
import NebulaTaskStore from './TaskStore';
import NebulaMonitorStore from './MonitorStore';
import NebulaDispatcher from './Dispatcher';
import Util from './Util';
import NebulaPermissions from './Permissions';
import NebulaError from './NebulaError';
import NebulaValidator from './Validator';
import { Constructor } from './types';

/**
 * The options for the addon
 */
export interface AddonOptions {
  /**
   * The name of the addon
   */
  name: string;

  /**
   * The customised instance of Validator
   */

  validator?: Constructor<NebulaValidator>;

  /**
   * The customised instance of CommandStore
   */
  commandStore?: Constructor<NebulaCommandStore>;

  /**
   * The customised instance of TaskStore
   */
  taskStore?: Constructor<NebulaTaskStore>;

  /**
   * The customised instance of MonitorStore
   */
  monitorStore?: Constructor<NebulaMonitorStore>;

  /**
   * The customised instance of dispatcher
   */
  dispatcher?: Constructor<NebulaDispatcher>;

  /**
   * The customised instance of Permissions
   */
  permissions?: Constructor<NebulaPermissions>;
}

export default abstract class Addon {
  /**
   * The client of the addon
   */
  public client: Client;

  /**
   * The command store of the addon
   */
  public commandStore: NebulaCommandStore;

  /**
   * The task store of the addon
   */
  public taskStore: NebulaTaskStore;

  /**
   * The monitor store of the addon
   */
  public monitorStore: NebulaMonitorStore;

  /**
   * The dispatcher of the addon
   */
  public dispatcher: NebulaDispatcher;

  /**
   * The validator of the addon
   */
  public validator: NebulaValidator;

  /**
   * The permissions of the addon
   */
  public permissions: NebulaPermissions;

  /**
   * The name of the addon
   */
  public name: string;

  /**
   * The options of the addon
   */
  public options: AddonOptions;

  /**
   * Invoked when the addon becomes ready to start working
   */
  public async didReady?(): Promise<void>;

  /**
   * The entry point of all Nebula resources
   * @param client The client of the addon
   * @param options The options of the addon
   */
  constructor(client: Client, options: AddonOptions) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the addon must be an object');

    if (options.name == null) throw new NebulaError('The name of the addon must be specified');

    const {
      name,
      commandStore: CommandStore,
      taskStore: TaskStore,
      monitorStore: MonitorStore,
      dispatcher: Dispatcher,
      validator: Validator,
      permissions: Permission,
    } = options;

    this.client = client;
    this.name = name;
    this.options = options;
    this.commandStore =
      CommandStore != null ? new CommandStore(this) : new NebulaCommandStore(this);
    this.taskStore = TaskStore != null ? new TaskStore(this) : new NebulaTaskStore(this);
    this.monitorStore =
      MonitorStore != null ? new MonitorStore(this) : new NebulaMonitorStore(this);
    this.dispatcher = Dispatcher ? new Dispatcher(this) : new NebulaDispatcher(this);
    this.validator = Validator ? new Validator() : new NebulaValidator();
    this.permissions = Permission ? new Permission(this) : new NebulaPermissions(this);

    // Has to be done after the addon has done loading other structures
    this.commandStore.load();
    this.taskStore.load();
    this.monitorStore.load();
  }
}
