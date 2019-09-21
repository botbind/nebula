import Discord from 'discord.js';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
import Addon from './Addon';
import Debugger from './Debugger';
import { Constructor, ClientOptions } from '../types';

const addons: Addon[] = [];

const defaultOptions = {
  typing: false,
  prefix: '!',
  debug: false,
};

export default class NebulaClient extends Discord.Client {
  // Discord client's options are public
  public readonly options: ClientOptions & typeof defaultOptions;

  public constructor(options: ClientOptions = {}) {
    if (!isPlainObject(options)) throw new TypeError('clientOptions must be an object');

    const mergedOptions = merge(defaultOptions, options);

    super(mergedOptions);

    this.options = mergedOptions;
    this.on('ready', () => {
      if (this.options.debug) Debugger.info('Client didReady', 'Lifecycle');
      if (this.didReady) this.didReady();

      addons.forEach(addon => {
        addon.loadResources();

        if (this.options.debug) Debugger.info(`${addon.name} didReady`, 'Lifecycle');
        if (addon.didReady) addon.didReady();
      });
    }).on('message', (message: Discord.Message) => {
      if (this.options.debug) Debugger.info('Client message', 'Lifecycle');
      if (this.didMessage) this.didMessage(message);

      addons.forEach(addon => {
        addon.dispatch(message);
      });
    });
  }

  public load(Addon: Constructor<Addon>) {
    if (Addon.prototype instanceof Addon)
      throw new TypeError('addon must inherit of the Addon class');

    const addon = new Addon(this);

    addons.push(addon);

    if (this.options.debug) Debugger.info(`${addon.name} load`, 'Lifecycle');
    if (addon.didLoad) addon.didLoad();

    return this;
  }

  protected didReady?(): void;
  protected didMessage?(message: Discord.Message): void;
}
