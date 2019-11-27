import Discord from 'discord.js';
import Addon from './Addon';
import JSONProvider from './JSONProvider';
import Validator from '../validator/Validator';
import Debugger from '../utils/Debugger';
import NebulaError from '../errors/NebulaError';
import { Constructor } from '../utils/types';

/**
 * The options for the client
 */
export interface ClientOptions extends Discord.ClientOptions {
  /**
   * Whether the client should "type" while processing the command
   */
  shouldType?: boolean;

  /**
   * The default prefix when the client first boots up
   */
  prefix?: string;

  /**
   * The discord ids of bot owners of the client
   */
  owners?: string[];

  /**
   * Whether the responses to commands should be edited/deleted when the user edits/deletes the activating message
   */
  shouldEditCommandResponses?: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command responses sweeping are disabled if set to 0. This is not recommended as the cache persists
   */
  commandMessageLifetime?: number;

  /**
   * The customised provider
   */
  provider?: Constructor<Discord.Collection<string, unknown>>;
}

const addons: Addon[] = [];

const optionsSchema = Validator.object({
  shouldType: Validator.boolean()
    .optional()
    .default(false),
  prefix: Validator.string()
    .optional()
    .default('!'),
  owners: Validator.array(Validator.string())
    .optional()
    .default([]),
  shouldEditCommandResponses: Validator.boolean()
    .optional()
    .default(false),
  commandMessageLifetime: Validator.number()
    .optional()
    .default(0),
  provider: Validator.misc<Discord.Collection<string, unknown>>()
    .inherit(Discord.Collection)
    .optional()
    .default(JSONProvider),
});

export default class Client extends Discord.Client {
  /**
   * Whether the client should "type" while processing the command
   */
  public shouldType: boolean;

  /**
   * The default prefix when the client first boots up
   */
  public prefix: string;

  /**
   * The discord ids for bot owners of the client
   */
  public owners: string[];

  /**
   * Whether the responses to commands should be edited/deleted when the user edits/deletes the activating message
   */
  public shouldEditCommandResponses: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command responses sweeping are disabled if set to 0. This is not recommended as the cache persists
   */
  public commandMessageLifetime: number;

  /**
   * The data fetched from the database for the client
   */
  public provider: Discord.Collection<string, unknown>;

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
  constructor(options: ClientOptions = {}) {
    const { value, errors } = optionsSchema.validate(options);

    if (errors.length > 0) throw errors[0];

    const {
      shouldType,
      prefix,
      owners,
      shouldEditCommandResponses,
      commandMessageLifetime = shouldEditCommandResponses ? 180000 : 0,
      provider,
      ...djsClientOptions
    } = value!;

    super(djsClientOptions);

    this.shouldType = shouldType;
    this.prefix = prefix;
    this.owners = owners;
    this.shouldEditCommandResponses = shouldEditCommandResponses;
    this.commandMessageLifetime = commandMessageLifetime;
    this.provider = new Provider(this, 'client');
    this.app = null;
    this.isReady = false;

    this.once('ready', async () => {
      this.isReady = true;
      this.app = await this.fetchApplication();

      if (!this.owners.includes(this.app.owner.id)) this.owners.push(this.app.owner.id);

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
    if (this.app == null) return null;

    const perms = new Discord.Permissions(3072);

    addons.forEach(addon => {
      addon.store.commands.forEach(command => {
        perms.add(...command.requiredPerms);
      });
    });

    return `https://discordapp.com/oauth2/authorize?client_id=${this.app.id}&permissions=${perms.bitfield}&scope=bot`;
  }

  /**
   * Inject addons
   * @param addon The addon to inject
   */
  protected inject(addon: Addon) {
    if (!(addon instanceof Addon))
      throw new NebulaError(Constants.ERROR_MESSAGES['client.inject.addon'](addon));

    addons.push(addon);

    return this;
  }

  /**
   * Invoked when the client becomes ready to start working
   */
  protected async ready?(): Promise<void>;
}
