import Client from './Client';
import NebulaStore from './Store';
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
   * The customised instance of Store
   */
  store?: Constructor<NebulaStore>;

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
   * The store of the addon
   */
  public store: NebulaStore;

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
    if (!Util.isObject(options)) throw new NebulaError('The options for Addon must be an object');

    const {
      name,
      store: Store,
      dispatcher: Dispatcher,
      validator: Validator,
      permissions: Permission,
    } = options;

    this.client = client;
    this.name = name;
    this.options = options;
    this.store = Store ? new Store(this) : new NebulaStore(this);
    this.dispatcher = Dispatcher ? new Dispatcher(this) : new NebulaDispatcher(this);
    this.validator = Validator ? new Validator() : new NebulaValidator();
    this.permissions = Permission ? new Permission(this) : new NebulaPermissions(this);

    // Has to be done after the addon has done loading other classes
    this.store.load();
  }
}
