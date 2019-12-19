import L from '@botbind/lyra';
import Discord from 'discord.js';
import Addon from './Addon';
import JSONProvider from './JSONProvider';
import Debugger from '../utils/Debugger';
import { Constructor } from '../utils/types';

/**
 * The options for the client.
 */
export interface ClientOptions extends Discord.ClientOptions {
  /**
   * Whether the client should "type" while processing the command.
   */
  shouldType?: boolean;

  /**
   * The default prefix when the client first boots up.
   */
  prefix?: string;

  /**
   * The discord ids of bot owners of the client.
   */
  owners?: string[];

  /**
   * Whether the responses to commands should be edited/deleted when the user edits/deletes the activating message.
   */
  shouldEditCommandResponses?: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command responses sweeping are disabled if set to 0. This is not recommended as the cache persists.
   */
  commandMessageLifetime?: number;

  /**
   * The customised provider.
   */
  provider?: Constructor<Discord.Collection<string, unknown>>;
}

const addons: Addon[] = [];

export default class Client extends Discord.Client {
  /**
   * Whether the client should "type" while processing the command.
   */
  shouldType: boolean;

  /**
   * The default prefix when the client first boots up.
   */
  prefix: string;

  /**
   * The discord ids for bot owners of the client.
   */
  owners: string[];

  /**
   * Whether the responses to commands should be edited/deleted when the user edits/deletes the activating message.
   */
  shouldEditCommandResponses: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command responses sweeping are disabled if set to 0. This is not recommended as the cache persists.
   */
  commandMessageLifetime: number;

  /**
   * The data fetched from the database for the client.
   */
  provider: Discord.Collection<string, unknown>;

  /**
   * The application of the client.
   */
  app: Discord.OAuth2Application | null;

  /**
   * Whether the client has become ready to start working.
   */
  isReady: boolean;

  /**
   * The main hub for loading addons.
   * @param options Options of the client.
   */
  constructor(options: ClientOptions = {}) {
    const result = L.object({
      shouldType: L.boolean().default(false),
      prefix: L.string().default('!'),
      owners: L.array(L.string()).default([]),
      shouldEditCommandResponses: L.boolean().default(false),
      commandMessageLifetime: L.number().when(L.ref('shouldEditCommandResponses'), {
        is: L.boolean().valid(true),
        then: L.number().default(180000),
        else: L.number().default(0),
      }),
      provider: L.function()
        .inherit(Discord.Collection)
        .default(JSONProvider, { literal: true }),
    })
      .label('clientOptions')
      .validate(options, { allowUnknown: true }); // Allow discord.js options

    if (result.errors !== null) throw result.errors[0];

    const {
      shouldType,
      prefix,
      owners,
      shouldEditCommandResponses,
      commandMessageLifetime,
      provider: Provider,
      ...djsClientOptions
    } = result.value;

    super(djsClientOptions);

    this.shouldType = shouldType;
    this.prefix = prefix;
    this.owners = owners;
    this.shouldEditCommandResponses = shouldEditCommandResponses;
    this.commandMessageLifetime = commandMessageLifetime;
    this.provider = new (Provider as Constructor<JSONProvider>)(this, 'client');
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
   * The invite link for the bot.
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
   * Inject addons.
   * @param addon The addon to inject.
   */
  inject(addon: Addon) {
    const result = L.object()
      .instance(Addon)
      .validate(addon);

    if (result.errors !== null) throw result.errors[0];

    addons.push(result.value as Addon);

    return this;
  }

  /**
   * Invoked when the client becomes ready to start working.
   */
  async ready?(): Promise<void>;
}
