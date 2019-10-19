import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import NebulaAddon from './Addon';
import NebulaError from './NebulaError';
import Command from './Command';
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

const loadedAddons: NebulaAddon[] = [];

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

    this.prependOnceListener('ready', async () => {
      const app = await this.fetchApplication();

      this.app = app;

      if (!this.options.owners.includes(app.owner.id)) this.options.owners.push(app.owner.id);

      if (this.didReady) this.didReady();
    });
  }

  /**
   * The invite link for the bot
   */
  get invite() {
    const permissions = new Discord.Permissions(3072);

    loadedAddons.forEach(addon => {
      addon.store.commands.forEach(({ resource }) => {
        permissions.add(...(resource as Command).options.requiredPermissions);
      });
    });

    return `https://discordapp.com/oauth2/authorize?client_id=${this.app!.id}&permissions=${
      permissions.bitfield
    }&scope=bot`;
  }

  /**
   * Inject addons
   * @param addons The addons to load
   */
  protected inject(...addons: Constructor<NebulaAddon>[]) {
    if (addons.length === 0) throw new NebulaError('At least 1 addon must be specified');

    loadedAddons.push(
      ...addons.map(Addon => {
        if (!(Addon.prototype instanceof NebulaAddon))
          throw new NebulaError('The addon to be loaded must inherit the Addon structure');

        return new Addon(this);
      }),
    );
  }
}
