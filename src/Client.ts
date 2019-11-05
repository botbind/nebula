import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Debugger from './Debugger';
import Util from './Util';
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
   * Whether the responses to commands should be edited/deleted when the user edits/deletes the activating message
   */
  editCommandResponses?: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command responses sweeping are disabled if set to 0. This is not recommended as the cache persists
   */
  commandMessageLifetime?: number;
}

/**
 * The options passed as argument for the client
 */
export type OptionalClientOptions = BaseClientOptions & Discord.ClientOptions;

/**
 * The options for the client
 */
export type ClientOptions = Required<BaseClientOptions> & Discord.ClientOptions;

const addons: Addon[] = [];

const defaultOptions: ClientOptions = {
  typing: false,
  prefix: '!',
  owners: [],
  editCommandResponses: false,
  commandMessageLifetime: 0,
};

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
   * Whether the client has become ready to start working
   */
  public isReady: boolean;

  /**
   * The main hub for loading addons
   * @param options Options of the client
   */
  constructor(options: OptionalClientOptions = {}) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the client must be an object');

    if (options.editCommandResponses && options.commandMessageLifetime === 0) {
      // The default lifetime is 30 minutes
      // eslint-disable-next-line no-param-reassign
      options.commandMessageLifetime = 1800000;
    }

    const mergedOptions = merge({}, defaultOptions, options);

    super(mergedOptions);

    this.options = mergedOptions;
    this.isReady = false;
    this.app = null;

    this.once('ready', async () => {
      this.isReady = true;
      this.app = await this.fetchApplication();

      if (!this.options.owners.includes(this.app.owner.id))
        this.options.owners.push(this.app.owner.id);

      if (this.ready) {
        Debugger.info(`${this.constructor.name} ready`, 'Lifecycle');

        this.ready();
      }

      this.emit('ready');
    });
  }

  /**
   * The invite link for the bot
   */
  get invite() {
    if (!this.isReady) return null;

    const permissions = new Discord.Permissions(3072);

    addons.forEach(addon => {
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
   * @param addon The addon to inject
   */
  protected inject(addon: Addon) {
    if (!(addon instanceof Addon)) throw new NebulaError('Addon is invalid');

    addons.push(addon);
  }

  /**
   * Invoked when the client becomes ready to start working
   */
  protected async ready?(): Promise<void>;
}
