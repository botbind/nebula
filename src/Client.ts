import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import Addon from './Addon';
import { Constructor } from './types';

export interface ClientOptions extends Discord.ClientOptions {
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
}

const addons: Addon[] = [];

const defaultOptions = {
  typing: false,
  prefix: '!',
  debug: false,
};

export default class NebulaClient extends Discord.Client {
  /**
   * The options of the client
   */
  readonly options: ClientOptions & typeof defaultOptions;

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
  constructor(options: ClientOptions = {}) {
    if (!Util.isObject(options)) throw new TypeError('clientOptions must be an object');

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
   * @param Addon The addon to load
   */
  protected load(Addon: Constructor<Addon>) {
    if (Addon.prototype instanceof Addon)
      throw new TypeError('addon must inherit of the Addon class');

    const addon = new Addon(this);

    addons.push(addon);

    addon.loadResources();
    if (addon.didReady) addon.didReady();

    return this;
  }
}
