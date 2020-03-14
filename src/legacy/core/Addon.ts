import L from '@botbind/lyra';
import Client from './Client';
import Store, { StoreConstructor } from './Store';
import Dispatcher from './Dispatcher';
import Permissions from './Permissions';
import Event from './Event';
import Debugger from '../utils/Debugger';

/**
 * The options for the addon.
 */
export interface AddonOptions {
  /**
   * The client of the addon.
   */
  client: Client;

  /**
   * The name of the addon.
   */
  name: string;

  /**
   * The customised implementation of `Store`.
   */
  store?: StoreConstructor;

  /**
   * The customised implementation of `Dispatcher`.
   */
  dispatcher?: Constructor<Dispatcher>;

  /**
   * The customised implementation of `Permissions`.
   */
  permissions?: Constructor<Permissions>;
}

export default class Addon {
  /**
   * The client of the addon.
   */
  client: Client;

  /**
   * The store of the addon.
   */
  store: Store;

  /**
   * The permissions of the addon.
   */
  permissions: Permissions;

  /**
   * The dispatcher of the addon.
   */
  dispatcher: Dispatcher;

  /**
   * The name of the addon.
   */
  name: string;

  /**
   * The entry point of all Nebula resources.
   * @param options The options of the addon.
   */
  constructor(options: AddonOptions) {
    const result = L.object({
      client: L.object()
        .instance(Client)
        .required(),
      name: L.string().required(),
      store: L.function()
        .inherit(Store)
        .default(Store, { literal: true }),
      permissions: L.function()
        .inherit(Permissions)
        .default(Permissions, { literal: true }),
      dispatcher: L.function()
        .inherit(Dispatcher)
        .default(Dispatcher, { literal: true }),
    })
      .label('Addon options')
      .validate(options);

    if (result.errors !== null) throw result.errors[0];

    const {
      client,
      name,
      store: CustomizedStore,
      dispatcher: CustomizedDispatcher,
      permissions: CustomizedPermissions,
    } = result.value;

    this.client = client as Client;
    this.name = name;
    this.store = new (CustomizedStore as StoreConstructor)({ addon: this });
    this.dispatcher = new (CustomizedDispatcher as Constructor<Dispatcher>)(this);
    this.permissions = new (CustomizedPermissions as Constructor<Permissions>)(this);

    // Has to be done after the addon has done loading other classes
    this.store.load();

    // Group event dispatchers.
    const onceEvents = new Map<string, Event[]>();
    const onEvents = new Map<string, Event[]>();

    this.store.events.forEach(event => {
      const eventCollection = event.once ? onceEvents : onEvents;
      const fetchedEvent = eventCollection.get(event.name);

      if (fetchedEvent === undefined) eventCollection.set(event.name, [event]);
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

    if (this.client.editCommandResponses)
      this.client
        .on('messageUpdate', (oldMessage, newMessage) => {
          if (oldMessage.content === newMessage.content) return;

          this.dispatcher.invokeLifecycles(newMessage);
        })
        .on('messageDelete', message => {
          this.dispatcher.deleteResponses(message);
        });

    Debugger.success(`${this.constructor.name} injected`);
  }
}

export interface AddonConstructor {
  new (options: AddonOptions): Addon;
}
