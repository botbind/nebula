import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import NebulaAddon from './Addon';
import NebulaError from './NebulaError';
import { Constructor } from './types';

/**
 * The optional options for the client
 */
export interface OptionalClientOptions {
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
}

/**
 * The options for the client
 */
export type ClientOptions = OptionalClientOptions & Discord.ClientOptions;

/**
 * The options passed as argument for the client
 */
export type ClientOptionsArg = Partial<OptionalClientOptions> & Discord.ClientOptions;

const defaultOptions: OptionalClientOptions = {
  typing: false,
  prefix: '!',
  debug: false,
};

const addons: Addon[] = [];

export default class Client extends Discord.Client {
  /**
   * The options of the client
   */
  readonly options: ClientOptions;

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
    if (!Util.isObject(options)) throw new NebulaError('clientOptions must be an object');

    const mergedOptions = merge({}, defaultOptions, options);

    super(mergedOptions);

    this.options = mergedOptions;

    this.on('ready', () => {
      if (this.didReady) this.didReady();
    })
      .on('message', message => {
        if (message.author.bot) return;

        if (this.didMessage) this.didMessage(message);

        addons.forEach(addon => {
          const commandComponents = addon.parseCommand(message.content);

          if (commandComponents[0] !== this.options.prefix) return;

          if (this.options.typing) message.channel.startTyping();

          addon.dispatch(message, commandComponents);

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
      throw new NebulaError('addon must inherit the Addon class');

    const addon = new Addon(this);

    addons.push(addon);

    addon.loadResources();
    if (addon.didReady) addon.didReady();

    return this;
  }
}
