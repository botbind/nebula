import Discord from 'discord.js';
import Client from './Client';
import NebulaStore from './Store';
import NebulaDispatcher from './Dispatcher';
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

    const eventsByName = new Discord.Collection<string, Event[]>();

    this.store.events.forEach(event => {
      const fetchedEvent = eventsByName.get(event.name);

      if (fetchedEvent == null) eventsByName.set(event.name, [event]);
      else fetchedEvent.push(event);
    });

    // Trying having as few event listeners as possible
    eventsByName.forEach((events, eventName) => {
      const onEvents: Event[] = [];
      const onceEvents = events.filter(event => {
        if (event.options.once) return true;

        onEvents.push(event);

        return false;
      });

      if (onEvents.length > 0)
        this.client.on(eventName, (...args: unknown[]) => {
          onEvents.forEach(event => event.didDispatch(...args));
        });

      if (onceEvents.length > 0)
        this.client.once(eventName, (...args: unknown[]) => {
          onceEvents.forEach(event => event.didDispatch(...args));
        });
    });

    this.client
      .on('message', async message => {
        const shouldDispatches = await Promise.all(
          this.store.monitors.map(monitor => monitor.shouldDispatch(message)),
        );

        shouldDispatches.forEach((shouldDispatch, i) => {
          if (shouldDispatch) this.store.monitors[i].didDispatch(message);
        });

        this._runDispatcher(message);
      })
      .on('messageUpdate', (oldMessage, newMessage) => {
        if (oldMessage.content === newMessage.content || !this.client.options.commandEditable)
          return;

        this._runDispatcher(newMessage);
      })
      .on('messageDelete', message => {
        this.dispatcher.deletePrevResponse(message);
        this.dispatcher.commandHistory.delete(message.id);
      });
  }

  private async _runDispatcher(message: Discord.Message) {
    const shouldDispatch = await this.dispatcher.shouldDispatch(message);

    if (shouldDispatch) this.dispatcher.didDispatch(message);
  }
}
