const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const Discord = require('discord.js');
const Addon = require('./addon');
const Logger = require('./logger');
const Provider = require('./provider');
const JSONProvider = require('./jsonProvider');
const _runErrorCustomizer = require('./internals/_runErrorCustomizer');

const _clientSymbol = Symbol('__CLIENT__');
// Private addons
const _addons = [];

class _Client extends Discord.Client {
  constructor({ djsOpts, logger, provider, ...opts }) {
    super(djsOpts);

    this._opts = opts;

    this.logger = logger;
    this.provider = null;
    this.app = null;
    this.ready = false;
    this.addons = []; // Public addons

    this.once('ready', async () => {
      // Fetch app
      try {
        this.app = await this.fetchApplication();
      } catch (err) {
        await this.error('client.app', { err });

        // Crit
        process.exit(1);
      }

      // Provider
      await provider.initialize(this);

      provider.set('prefix', this._opts.prefix);

      this.provider = provider;

      const addons = [...this.addons, ..._addons];

      // Initialize addons
      for (const addon of addons) {
        await addon.initialize(this);

        this.logger.success('Successfully inject', addon.name);
      }

      // Attach events
      const onceEvents = {};
      const onEvents = {};

      for (const addon of addons)
        for (const event of addon.events) {
          const name = event.name;
          const collection = event._opts.once ? onceEvents : onEvents;

          if (collection[name] === undefined) collection[name] = event.run.bind(event);
          else {
            // Merge events
            const prevRun = collection[name];

            collection[name] = (...args) => {
              prevRun(...args);
              event.run(...args);
            };
          }
        }

      for (const eventName of Object.keys(onceEvents)) this.once(eventName, onceEvents[eventName]);

      for (const eventName of Object.keys(onEvents)) this.on(eventName, onEvents[eventName]);

      if (this._opts.initialize !== undefined)
        try {
          await this._opts.initialize(this);
        } catch (err) {
          this.error('client.initialize', { err });
        }

      this.ready = true;

      this.emit('nebulaReady');

      // Only attach after ready
      this.on('message', async message => {
        if (this._opts.typing) message.channel.startTyping();

        for (const addon of addons) addon.run(message);

        if (this._opts.typing) message.channel.stopTyping();
      });
    });
  }

  get invite() {
    assert(this.ready, 'Client is not yet ready');

    const perms = new Discord.Permissions(3072);

    for (const addon of [...this.addons, ..._addons])
      for (const command of addon.commands) perms.add(...command._opts.perms);

    return `https://discordapp.com/oauth2/authorize?client_id=${this.app.id}&permissions=${perms.bitfield}&scope=bot`;
  }

  describe() {
    const addons = [...this.addons, ..._addons];
    const desc = {};

    if (addons.length > 0) desc.addons = addons.map(addon => addon.describe());

    return desc;
  }

  inject(addon, opts) {
    if (typeof addon === 'function') addon = addon(opts);

    assert(Addon.isAddon(addon), 'The parameter addon for Client.inject must be a valid addon');

    if (addon._opts.public) this.addons.push(addon);
    else _addons.push(addon);

    return this;
  }

  destroy() {
    this.provider.destroy();
    super.destroy();
  }

  async error(code, ctx) {
    const next = await _runErrorCustomizer(this, 'Client.error', code, ctx);

    if (!next) return;

    if (code === 'client.app') this.logger.error('Cannot fetch application due to', ctx.err);

    if (code === 'client.initialize')
      this.logger.error('Cannot run the custom initializer for client due to', ctx.err);
  }
}

Object.defineProperty(_Client.prototype, _clientSymbol, { value: true });

function client(opts = {}) {
  assert(isObject(opts), 'The parameter opts for client must be an object');

  opts = {
    prefix: '!',
    typing: false,
    editResponses: false,
    commandLifetime: 0,
    logger: Logger.logger(),
    provider: JSONProvider,
    ...opts,
  };

  assert(typeof opts.baseDir === 'string', 'The option baseDir for client must be a string');

  assert(typeof opts.prefix === 'string', 'The option prefix for client must be a string');

  assert(typeof opts.typing === 'boolean', 'The option typing for client must be a boolean');

  assert(
    opts.lang === undefined || typeof opts.lang === 'string',
    'The option lang for client must be a string',
  );

  assert(
    typeof opts.editResponses === 'boolean',
    'The option editResponses for client must be a boolean',
  );

  assert(
    typeof opts.commandLifetime === 'number',
    'The option commandLifetime for client must be a number',
  );

  assert(Logger.isLogger(opts.logger), 'The option logger for client must be a valid logger');

  assert(
    Provider.isProvider(opts.provider),
    'The option provider for client must be a valid provider',
  );

  ['initialize', 'error'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option error for client must be a function',
    ),
  );

  if (opts.editResponses && opts.commandLifetime === 0)
    opts.logger.warn(
      'The option commandLifetime should not be set to 0 when editResponses is enabled',
    );

  return new _Client(opts);
}

function isClient(value) {
  return value != null && !!value[_clientSymbol];
}

module.exports = {
  client,
  isClient,
};
