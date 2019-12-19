import L from '@botbind/lyra';
import Client from './Client';
import Store from './Store';
import Dispatcher from './Dispatcher';
import Permissions from './Permissions';
import Event from './Event';
import Debugger from '../utils/Debugger';
import { Constructor } from '../utils/types';

/**
 * The options for the addon.
 */
export interface AddonOptions {
  /**
   * The name of the addon.
   */
  name: string;

  /**
   * The customised implementation of `Store`.
   */
  store?: Constructor<Store>;

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
  public client: Client;

  /**
   * The store of the addon.
   */
  public store: Store;

  /**
   * The permissions of the addon.
   */
  public permissions: Permissions;

  /**
   * The dispatcher of the addon.
   */
  public dispatcher: Dispatcher;

  /**
   * The name of the addon.
   */
  public name: string;

  /**
   * The entry point of all Nebula resources.
   * @param client The client of the addon.
   * @param options The options of the addon.
   */
  constructor(client: Client, options: AddonOptions) {
    const result = L.object({
      name: L.string().required(),
      store: L.function<Constructor<Store>>()
        .inherit(Store)
        .default(Store, { literal: true }),
      permissions: L.function<Constructor<Permissions>>()
        .inherit(Permissions)
        .default(Permissions, { literal: true }),
      dispatcher: L.function<Constructor<Dispatcher>>()
        .inherit(Dispatcher)
        .default(Dispatcher, { literal: true }),
    })
      .label('addonOptions')
      .validate(options);

    if (result.errors !== null) throw result.errors[0];

    const {
      name,
      store: CustomizedStore,
      dispatcher: CustomizedDispatcher,
      permissions: CustomizedPermissions,
    } = result.value;

    this.client = client;
    this.name = name;
    this.store = new CustomizedStore(this);
    this.dispatcher = new CustomizedDispatcher(this);
    this.permissions = new CustomizedPermissions(this);

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

    if (this.client.shouldEditCommandResponses)
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
