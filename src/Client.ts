import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import NebulaAddon from './Addon';
import NebulaError from './NebulaError';
import { Constructor } from './types';

interface DefaultClientOptions {
  /**
   * Whether the client should "type" while processing the command
   */
  typing: boolean;

  /**
   * The default prefix when the client first boots up
   */
  prefix: string;

  /**
   * Whether the client should start in debug mode
   */
  debug: boolean;

  /**
   * The discord ids for bot owners of the client
   */
  owners: string[];
}

/**
 * The options for the client
 */
export type ClientOptions = DefaultClientOptions & Discord.ClientOptions;

/**
 * The options passed as argument for the client
 */
export type ClientOptionsArg = Partial<DefaultClientOptions> & Discord.ClientOptions;

const defaultOptions: DefaultClientOptions = {
  typing: false,
  prefix: '!',
  debug: false,
  owners: [],
};

const addons: NebulaAddon[] = [];

export default class Client extends Discord.Client {
  /**
   * The options of the client
   */
  readonly options: ClientOptions;

  /**
   * The application of the client
   */
  app: Discord.OAuth2Application | null;

  /**
   * Invoked when the client becomes ready to start working
   */
  didReady?(): void;

  /**
   * Invoked when a message is created
   * @param message The created message
   */
  didMessage?(message: Discord.Message): void;

  /**
   * Invoked when the client's WebSocket encounters a connection error
   * @param error The encountered error
   */
  didCatchError?(err: Error): void;

  /**
   * The main hub for loading addons
   * @param options Options of the client
   */
  constructor(options: ClientOptionsArg = {}) {
    if (!Util.isObject(options)) throw new NebulaError('The options for Client must be an object');

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
      .on('message', message => {
        if (message.author.bot) return;

        if (this.didMessage) this.didMessage(message);

        addons.forEach(addon => {
          const commandComponents = addon.dispatcher.parseCommand(message.content);

          if (commandComponents[0] !== this.options.prefix) return;

          if (this.options.typing) message.channel.startTyping();

          addon.dispatcher.dispatch(message, commandComponents);

          if (this.options.typing) message.channel.stopTyping();
        });
      })
      .on('error', err => {
        if (this.didCatchError) this.didCatchError(err);
      });
  }

  /**
   * Load and start an addon
   * @param AddonToLoad The addon to load
   */
  protected load(Addon: Constructor<NebulaAddon>) {
    if (!(Addon.prototype instanceof NebulaAddon))
      throw new NebulaError('The addon to be loaded must inherit the Addon class');

    const addon = new Addon(this);

    addons.push(addon);

    addon.store.load();
    if (addon.didReady) addon.didReady();

    return this;
  }
}
