import Discord from 'discord.js';
import Client from './Client';
import NebulaStore from './Store';
import NebulaDispatcher from './Dispatcher';
import Debugger from './Debugger';
import Util from './Util';
import NebulaPermissions from './Permissions';
import Event from './Event';
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

export default class Addon {
  /**
   * The client of the addon
   */
  public client: Client;

  /**
   * The store of the addon
   */
  public store: NebulaStore;

  /**
   * The validator of the addon
   */
  public validator: NebulaValidator;

  /**
   * The permissions of the addon
   */
  public permissions: NebulaPermissions;

  /**
   * The dispatcher of the addon
   */
  public dispatcher: NebulaDispatcher;

  /**
   * The name of the addon
   */
  public name: string;

  /**
   * The options of the addon
   */
  public options: AddonOptions;

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
    this.validator = Validator ? new Validator() : new NebulaValidator();
    this.permissions = Permission ? new Permission(this) : new NebulaPermissions(this);
    this.dispatcher = Dispatcher ? new Dispatcher(this) : new NebulaDispatcher(this);

    // Has to be done after the addon has done loading other classes
    this.store.load();

    // Group event dispatchers
    const onceEvents = new Discord.Collection<string, Event[]>();
    const onEvents = new Discord.Collection<string, Event[]>();

    this.store.events.forEach(event => {
      const eventCollection = event.options.once ? onceEvents : onEvents;
      const fetchedEvent = eventCollection.get(event.name);

      if (fetchedEvent == null) eventCollection.set(event.name, [event]);
      else fetchedEvent.push(event);
    });

    // Trying having as few event listeners as possible
    onEvents.forEach((events, eventName) => {
      this.client.on(eventName, (...args: unknown[]) => {
        events.forEach(event => event.callLifecycles(...args));
      });
    });

    onceEvents.forEach((events, eventName) => {
      this.client.once(eventName, (...args: unknown[]) => {
        events.forEach(event => event.callLifecycles(...args));
      });
    });

    this.client
      .on('message', async message => {
        this.store.monitors.forEach(monitor => monitor.callLifecycles(message));

        this.dispatcher.callLifecycles(message);
      })
      .on('messageUpdate', (oldMessage, newMessage) => {
        if (oldMessage.content === newMessage.content || !this.client.options.editCommandResponses)
          return;

        this.dispatcher.callLifecycles(newMessage);
      })
      .on('messageDelete', message => {
        if (!this.client.options.deleteCommandResponses) return;

        this.dispatcher.deleteResponses(message);
      });

    Debugger.success(`${this.constructor.name} injected`);
  }
}
