import L from '@botbind/lyra';
import Discord from 'discord.js';
import Addon from './Addon';
import Provider, { ProviderConstructor } from './Provider';
import JsonProvider from './JsonProvider';
import Debugger from '../utils/Debugger';

/**
 * The options for the client.
 */
export interface ClientOptions extends Discord.ClientOptions {
  /**
   * Whether the client should "type" while processing the command.
   */
  typing?: boolean;

  /**
   * The default prefix when the client first boots up.
   */
  prefix?: string;

  /**
   * The user ids of bot owners of the client.
   */
  owners?: string[];

  /**
   * Whether the responses to commands should be altered when the user edits/deletes the activating
   * message.
   */
  editCommandResponses?: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command
   * responses sweeping are disabled if set to 0. This is not recommended as the cache persists.
   */
  commandMessageLifetime?: number;

  /**
   * The customised provider constructor. It must inherit the `Provider` base structure.
   */
  provider?: ProviderConstructor;
}

const addons: Addon[] = [];

export default class Client extends Discord.Client {
  /**
   * Whether the client should "type" while processing the command.
   */
  typing: boolean;

  /**
   * The default prefix when the client first boots up.
   */
  prefix: string;

  /**
   * The user ids for bot owners of the client.
   */
  owners: string[];

  /**
   * Whether the responses to commands should be altered when the user edits/deletes the activating
   * message.
   */
  editCommandResponses: boolean;

  /**
   * The amount of time in milliseconds that the command stays in cache since last edit. Command
   * responses sweeping are disabled if set to 0. This is not recommended as the cache persists.
   */
  commandMessageLifetime: number;

  /**
   * The database provider for the client.
   */
  provider: Provider;

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
      typing: L.boolean().default(false),
      prefix: L.string().default('!'),
      owners: L.array(L.string()).default([]),
      editCommandResponses: L.boolean().default(false),
      commandMessageLifetime: L.number().when(L.ref('editCommandResponses'), {
        is: L.boolean().valid(true),
        then: L.number().default(180000),
        else: L.number().default(0),
      }),
      provider: L.function()
        .inherit(Provider)
        .default(JsonProvider, { literal: true }),
    })
      .label('Client options')
      .validate(options, { allowUnknown: true }); // Allow discord.js options

    if (result.errors !== null) throw result.errors[0];

    const {
      typing,
      prefix,
      owners,
      editCommandResponses,
      commandMessageLifetime,
      provider: CustomizedProvider,
      ...djsClientOptions
    } = result.value;

    super(djsClientOptions);

    this.typing = typing;
    this.prefix = prefix;
    this.owners = owners;
    this.editCommandResponses = editCommandResponses;
    this.commandMessageLifetime = commandMessageLifetime;
    this.provider = new (CustomizedProvider as ProviderConstructor)({
      client: this,
      name: 'client',
    });
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
    if (this.app === null) return null;

    const perms = new Discord.Permissions(3072);

    addons.forEach(addon => {
      addon.store.commands.forEach(command => {
        perms.add(...command.requiredPerms);
      });
    });

    return `https://discordapp.com/oauth2/authorize?client_id=${this.app.id}&permissions=${perms.bitfield}&scope=bot`;
  }

  /**
   * Injects addons.
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
