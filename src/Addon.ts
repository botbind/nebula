import Client from './Client';
import NebulaStore from './Store';
import NebulaDispatcher from './Dispatcher';
import Util from './Util';
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
}

export default abstract class Addon {
  /**
   * The client of the addon
   */
  client: Client;

  /**
   * The store of the addon
   */
  store: NebulaStore;

  /**
   * The dispatcher of the addon
   */
  dispatcher: NebulaDispatcher;

  /**
   * The validator of the addon
   */
  validator: NebulaValidator;

  /**
   * The name of the addon
   */
  readonly name: string;

  /**
   * The options of the addon
   */
  readonly options: AddonOptions;

  /**
   * Invoked when the addon becomes ready to start working
   */
  didReady?(): void;

  /**
   * The main hub for creating addons
   * @param client The client of the addon
   * @param options The options of the addon
   */
  constructor(client: Client, options: AddonOptions) {
    if (!Util.isObject(options)) throw new NebulaError('addonOptions must be an object');

    const { name, store: Store, dispatcher: Dispatcher, validator: Validator } = options;

    this.client = client;
    this.name = name;
    this.options = options;
    this.store = Store ? new Store(this) : new NebulaStore(this);
    this.dispatcher = Dispatcher ? new Dispatcher(this) : new NebulaDispatcher(this);
    this.validator = Validator ? new Validator() : new NebulaValidator();
  }
}
