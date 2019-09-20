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
      if (this.options.debug) Debugger.info('Client ready', 'Lifecycle');
      if (this.ready) this.ready();

      addons.forEach(addon => {
        addon.loadResources();

        if (this.options.debug) Debugger.info(`${addon.name} ready`, 'Lifecycle');
        if (addon.ready) addon.ready();
      });
    }).on('message', (message: Discord.Message) => {
      if (this.options.debug) Debugger.info('Client message', 'Lifecycle');

      addons.forEach(addon => {
        addon.dispatch(message);
      });
    });
  }

  public load(Addon: Constructor<Addon>) {
    if (Addon.prototype instanceof Addon)
      throw new TypeError('addon must inherit of the Addon class');

    const addon = new Addon(this, {
      prefix: this.options.prefix,
    });

    addons.push(addon);

    if (this.options.debug) Debugger.info(`${addon.name} loaded`, 'Lifecycle');
    if (addon.loaded) addon.loaded();

    if (this.options.debug) Debugger.info('Client afterAddonLoaded', 'Lifecycle');
    if (this.afterAddonLoaded) this.afterAddonLoaded(addon);

    return this;
  }

  protected ready?(): void;
  protected afterAddonLoaded?(addon: Addon): void;
  protected message?(message: Discord.Message): void;
}
