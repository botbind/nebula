const Discord = require('discord.js');
const Dust = require('@botbind/dust');
const { logger, isLogger } = require('./logger');
const { isAddon } = require('./addon');
const sqliteProvider = require('./sqliteProvider');
const { isProvider } = require('./provider');

const _clientSymbol = Symbol('__CLIENT__');

// Sandboxed addons
const _addons = [];

class _Client extends Discord.Client {
  constructor(opts) {
    Dust.assert(Dust.isObject(opts), 'The parameter opts for client must be an object');

    const { djsOpts, logger: customizedLogger, provider: customizedProvider, ...actualOpts } = {
      baseDir: process.cwd(),
      typing: false,
      prefix: '!',
      editResponses: false,
      commandLifetime: 0,
      logger: logger(),
      provider: sqliteProvider(),
      ...opts,
    };

    Dust.assert(
      typeof actualOpts.baseDir === 'string',
      'The option baseDir for client must be a string',
    );

    Dust.assert(
      typeof actualOpts.typing === 'boolean',
      'The option typing for client must be a boolean',
    );

    Dust.assert(
      typeof actualOpts.prefix === 'string',
      'The option prefix for client must be a string',
    );

    Dust.assert(
      typeof actualOpts.editResponses === 'boolean',
      'The option editResponses for client must be a boolean',
    );

    Dust.assert(
      typeof actualOpts.commandLifetime === 'number',
      'The option commandLifetime for client must be a number',
    );

    Dust.assert(isLogger(customizedLogger), 'The option logger for client must be a valid logger');

    Dust.assert(
      isProvider(customizedProvider),
      'The option provider for client must be a valid provider',
    );

    if (actualOpts.editResponses && actualOpts.commandLifetime === 0)
      customizedLogger.warn(
        'The option commandLifetime should not be set to 0 when editResponses is enabled',
      );

    super(djsOpts);

    this.opts = actualOpts;
    this.logger = customizedLogger;
    this.provider = null;
    this.app = null;
    this.ready = null;
    // Exposed addons
    this.addons = [];

    this.on('ready', async () => {
      this.ready = true;

      try {
        this.app = await this.fetchApplication();
      } catch (err) {
        this.logger.error('Failed to fetch application due to', err);

        return;
      }

      const provider = customizedProvider;

      provider.client = this;

      try {
        await provider.initialize();
      } catch (err) {
        this.logger.error('Failed to initialize provider due to', err);

        return;
      }

      this.provider = provider;

      this.emit('nebulaReady');
    }).on('message', message => {
      if (message.author.bot) return;

      if (this.opts.typing) message.channel.startTyping();

      for (const addon of [..._addons, ...this.addons]) addon.dispatch();

      if (this.opts.typing) message.channel.stopTyping(true);
    });
  }

  async inject(addon, opts) {
    if (typeof addon === 'function') addon = addon(opts);

    Dust.assert(isAddon(addon), 'The parameter addon for Client.inject must be a valid addon');

    addon.client = this;

    try {
      await addon.initialize();
    } catch (err) {
      this.logger.error(addon.name, 'failed to load due to', err);

      return;
    }

    if (addon.public) this.addons.push(addon);
    else _addons.push(addon);

    this.logger.success(addon.name, 'successfully loaded!');
  }
}

Object.defineProperties(_Client.prototype, _clientSymbol, { value: true });

function client(opts = {}) {
  return new _Client(opts);
}

function isClient(value) {
  return value != null && !!value[_clientSymbol];
}

module.exports = {
  client,
  isClient,
};
