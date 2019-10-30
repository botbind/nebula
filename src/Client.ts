import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import Addon from './Addon';
import Debugger from './Debugger';
import NebulaError from './NebulaError';

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
   * The discord ids for bot owners of the client
   */
  owners?: string[];

  /**
   * Whether the responses to commands should be edited when the user edits the activating message
   */
  editCommandResponses?: boolean;

  /**
   * The amount of time in milliseconds that the command responses cache should be sweeped. Command responses sweeping are disabled if set to 0
   */
  commandResponsesSweepDuration?: number;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command responses sweeping are disabled if set to 0
   */
  commandMessageLifetime?: number;

  /**
   * Whether the responses to commands should be deleted when the user deletes the activating message
   */
  deleteCommandResponses?: boolean;
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
  owners: [],
  editCommandResponses: false,
  deleteCommandResponses: false,
  commandMessageLifetime: 0,
  commandResponsesSweepDuration: 0,
};

const loadedAddons: Addon[] = [];

export default class Client extends Discord.Client {
  /**
   * The options of the client
   */
  public options: ClientOptions;

  /**
   * The application of the client
   */
  public app?: Discord.OAuth2Application | null;

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

    this.once('ready', async () => {
      const app = await this.fetchApplication();

      this.app = app;

      if (!this.options.owners.includes(app.owner.id)) this.options.owners.push(app.owner.id);

      if (this.didReady) {
        Debugger.info(`${this.constructor.name} ready`, 'Lifecycle');

        this.didReady();
      }

      this.emit('ready');
    });
  }

  /**
   * The invite link for the bot
   */
  get invite() {
    const permissions = new Discord.Permissions(3072);

    loadedAddons.forEach(addon => {
      addon.store.commands.forEach(command => {
        permissions.add(...command.options.requiredPermissions);
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
  protected inject(...addons: Addon[]) {
    if (addons.length === 0) throw new NebulaError('At least 1 addon must be specified');

    loadedAddons.push(...addons);
  }

  /**
   * Invoked when the client becomes ready to start working
   */
  protected async didReady?(): Promise<void>;
}
