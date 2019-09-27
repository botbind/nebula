import Discord from 'discord.js';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
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

  constructor(options: ClientOptions = {}) {
    if (!isPlainObject(options)) throw new TypeError('clientOptions must be an object');

    const mergedOptions = merge({}, defaultOptions, options);

    super(mergedOptions);

    this.options = mergedOptions;
    this.on('ready', () => {
      this.callLifecycle('didReady');

      addons.forEach(addon => {
        addon.loadResources();

        this.callLifecycle('didReady', addon);
      });
    }).on('message', (message: Discord.Message) => {
      this.callLifecycle('didMessage');

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

    return this;
  }

  public callLifecycle(name: string, structure: any = this, ...args: any[]) {
    if (this.options.debug) Debugger.info(`${structure.constructor.name} ${name}`, 'Lifecycle');
    if (structure[name]) {
      if (!isFunction(structure[name])) throw new TypeError('Lifecycle must be a function');

      return structure[name](...args);
    }
  }

  protected didReady?(): void;
  protected didMessage?(message: Discord.Message): void;
}
