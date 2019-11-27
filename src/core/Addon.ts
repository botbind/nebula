import Discord from 'discord.js';
import Client from './Client';
import Store from './Store';
import Dispatcher from './Dispatcher';
import Permissions from './Permissions';
import Validator from './Validator';
import Debugger from './Debugger';
import Util from './Util';
import Event from './Event';
import NebulaError from './NebulaError';
import * as Constants from './constants';
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
   * The customised implementation of Validator
   */
  validator?: Constructor<Validator>;

  /**
   * The customised implementation of Store
   */
  store?: Constructor<Store>;

  /**
   * The customised implementation of dispatcher
   */
  dispatcher?: Constructor<Dispatcher>;

  /**
   * The customised implementation of Permissions
   */
  permissions?: Constructor<Permissions>;
}

export default class Addon {
  /**
   * The client of the addon
   */
  public client: Client;

  /**
   * The store of the addon
   */
  public store: Store;

  /**
   * The validator of the addon
   */
  public validator: Validator;

  /**
   * The permissions of the addon
   */
  public permissions: Permissions;

  /**
   * The dispatcher of the addon
   */
  public dispatcher: Dispatcher;

  /**
   * The name of the addon
   */
  public name: string;

  /**
   * The entry point of all Nebula resources
   * @param client The client of the addon
   * @param options The options of the addon
   */
  constructor(client: Client, options: AddonOptions) {
    if (Constants.IS_DEV && !Util.isObject(options))
      throw new NebulaError(Constants.ERROR_MESSAGES['addon.options']);

    const {
      name,
      store: CustomisedStore,
      dispatcher: CustomisedDispatcher,
      validator: CustomisedValidator,
      permissions: CustomisedPermissions,
    } = options;

    if (Constants.IS_DEV) {
      if (typeof name === 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['addon.options.name']);

      if (CustomisedStore != null && !(CustomisedStore.prototype instanceof Store))
        throw new NebulaError(Constants.ERROR_MESSAGES['addon.options.store']);

      if (CustomisedDispatcher != null && !(CustomisedDispatcher.prototype instanceof Dispatcher))
        throw new NebulaError(Constants.ERROR_MESSAGES['addon.options.dispatcher']);

      if (CustomisedValidator != null && !(CustomisedValidator.prototype instanceof Validator))
        throw new NebulaError(Constants.ERROR_MESSAGES['addon.options.validator']);

      if (
        CustomisedPermissions != null &&
        !(CustomisedPermissions.prototype instanceof Permissions)
      )
        throw new NebulaError(Constants.ERROR_MESSAGES['addon.options.permissions']);
    }

    this.client = client;
    this.name = name;
    this.store = CustomisedStore != null ? new CustomisedStore(this) : new Store(this);
    this.dispatcher =
      CustomisedDispatcher != null ? new CustomisedDispatcher(this) : new Dispatcher(this);
    this.validator = CustomisedValidator != null ? new CustomisedValidator(this) : new Validator();
    this.permissions =
      CustomisedPermissions != null ? new CustomisedPermissions(this) : new Permissions(this);

    // Has to be done after the addon has done loading other classes
    this.store.load();

    // Group event dispatchers
    const onceEvents = new Discord.Collection<string, Event[]>();
    const onEvents = new Discord.Collection<string, Event[]>();

    this.store.events.forEach(event => {
      const eventCollection = event.once ? onceEvents : onEvents;
      const fetchedEvent = eventCollection.get(event.name);

      if (fetchedEvent == null) eventCollection.set(event.name, [event]);
      else fetchedEvent.push(event);
    });

    // Trying having as few event listeners as possible
    onEvents.forEach((events, eventName) => {
      this.client.on(eventName, (...args: unknown[]) => {
        events.forEach(event => event.invokeLifecycles(...args));
      });
    });

    onceEvents.forEach((events, eventName) => {
      this.client.once(eventName, (...args: unknown[]) => {
        events.forEach(event => event.invokeLifecycles(...args));
      });
    });

    this.client.on('message', async message => {
      this.store.monitors.forEach(monitor => monitor.invokeLifecycles(message));

      this.dispatcher.invokeLifecycles(message);
    });

    if (this.client.shouldEditCommandResponses) {
      this.client
        .on('messageUpdate', (oldMessage, newMessage) => {
          if (oldMessage.content === newMessage.content) return;

          this.dispatcher.invokeLifecycles(newMessage);
        })
        .on('messageDelete', message => {
          this.dispatcher.deleteResponses(message);
        });
    }

    Debugger.success(`${this.constructor.name} injected`);
  }
}
