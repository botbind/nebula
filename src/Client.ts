import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import NebulaAddon from './Addon';
import Monitor from './Monitor';
import NebulaError from './NebulaError';
import { Constructor } from './types';

interface BaseClientOptions {
  /**
   * Whether the client should "type" while processing the command
   */
  typing?: boolean;

  /**
   * The default prefix when the client first boots up
   */
  prefix?: string;

  /**
   * Whether the client should start in debug mode
   */
  debug?: boolean;

  /**
   * The discord ids for bot owners of the client
   */
  owners?: string[];
}

/**
 * The options passed as argument for the client
 */
export type OptionalClientOptions = BaseClientOptions & Discord.ClientOptions;

/**
 * The options for the client
 */
export type ClientOptions = Required<BaseClientOptions> & Discord.ClientOptions;

const defaultOptions: ClientOptions = {
  typing: false,
  prefix: '!',
  debug: process.env.NODE_ENV === 'development',
  owners: [],
};

const addons: NebulaAddon[] = [];

export default class Client extends Discord.Client {
  /**
   * The options of the client
   */
  public options: ClientOptions;

  /**
   * The application of the client
   */
  public app: Discord.OAuth2Application | null;

  /**
   * Invoked when the client becomes ready to start working
   */
  protected async didReady?(): Promise<void>;

  /**
   * Invoked when a message is created
   * @param message The created message
   */
  protected async didMessage?(message: Discord.Message): Promise<void>;

  /**
   * Invoked when the client's WebSocket encounters a connection error
   * @param error The encountered error
   */
  protected async didCatchError?(err: Error): Promise<void>;

  /**
   * The main hub for loading addons
   * @param options Options of the client
   */
  constructor(options: OptionalClientOptions = {}) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the client must be an object');

    const mergedOptions = merge({}, defaultOptions, options);

    super(mergedOptions);

    this.options = mergedOptions;
    this.app = null;

    this.on('ready', async () => {
      const app = await this.fetchApplication();

      this.app = app;

      if (!this.options.owners.includes(app.owner.id)) this.options.owners.push(app.owner.id);

      if (this.didReady) this.didReady();
    })
      .on('message', async message => {
        for (const addon of addons) {
          // Run monitors in parallel
          const shouldDispatches = await Promise.all(
            addon.store.monitors.map(({ resource }) => {
              const monitor = resource as Monitor;

              return monitor.shouldDispatch(message);
            }),
          );

          shouldDispatches.forEach((shouldDispatch, i) => {
            if (shouldDispatch) (addon.store.monitors[i].resource as Monitor).didDispatch(message);
          });
        }

        if (this.didMessage) this.didMessage(message);
      })
      .on('error', err => {
        if (this.didCatchError) this.didCatchError(err);
      });
  }

  /**
   * Load and start an addon
   * @param Addon The addon to load
   */
  protected load(Addon: Constructor<NebulaAddon>) {
    if (!(Addon.prototype instanceof NebulaAddon))
      throw new NebulaError('The addon to be loaded must inherit the Addon structure');

    const addon = new Addon(this);

    addons.push(addon);

    if (addon.didReady) addon.didReady();

    return this;
  }
}
