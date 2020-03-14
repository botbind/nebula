const Discord = require('discord.js');
const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const display = require('@botbind/dust/src/display');
const Colors = require('./colors');
const Addon = require('./addon');
const Provider = require('./provider');
const sqliteProvider = require('./sqliteProvider');

const _clientSymbol = Symbol('__CLIENT__');
// Sandboxed addons
const _addons = [];
const _logMethods = [
  ['blue', 'info'],
  ['yellow', 'warn'],
  ['red', 'error'],
  ['green', 'success'],
];
const _logger = {
  log: (...portions) => {
    const message = display.portions(...portions);

    if (message.length > 0) console.log(message);
  },
};

for (const [color, logMethod] of _logMethods) {
  _logger[logMethod] = function method(...portions) {
    this.log(
      Colors.colors()
        [color]()
        .bold(`[${logMethod}]`),
      ...portions,
    );
  };
}

class _Client extends Discord.Client {
  constructor(djsOpts, { provider, ...opts }) {
    super(djsOpts);

    this.opts = opts;
    this.logger = _logger;
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

      try {
        await provider.initialize(this);
      } catch (err) {
        this.logger.error('Failed to initialize provider due to', err);

        return;
      }

      this.provider = provider;

      this.emit('nebulaReady');
    }).on('message', message => {
      if (message.author.bot) return;

      if (this.opts.typing) message.channel.startTyping();

      for (const addon of [..._addons, ...this.addons]) {
        try {
          addon.run(message);
        } catch (err) {
          this.logger.error('Failed to run addon', addon.name, 'due to', err);
        }
      }

      if (this.opts.typing) message.channel.stopTyping(true);
    });
  }

  async inject(addon, opts) {
    if (typeof addon === 'function') addon = addon(opts);

    assert(Addon.isAddon(addon), 'The parameter addon for Client.inject must be a valid addon');

    try {
      await addon.initialize(this);
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
  assert(isObject(opts), 'The parameter opts for client must be an object');

  const { djsOpts, ...otherOpts } = {
    baseDir: process.cwd(),
    typing: false,
    prefix: '!',
    editResponses: false,
    commandLifetime: 0,
    provider: sqliteProvider(),
    ...opts,
  };

  assert(typeof otherOpts.baseDir === 'string', 'The option baseDir for client must be a string');

  assert(typeof otherOpts.typing === 'boolean', 'The option typing for client must be a boolean');

  assert(typeof otherOpts.prefix === 'string', 'The option prefix for client must be a string');

  assert(
    typeof otherOpts.editResponses === 'boolean',
    'The option editResponses for client must be a boolean',
  );

  assert(
    typeof otherOpts.commandLifetime === 'number',
    'The option commandLifetime for client must be a number',
  );

  assert(
    Provider.isProvider(otherOpts.provider),
    'The option provider for client must be a valid provider',
  );

  if (otherOpts.editResponses && otherOpts.commandLifetime === 0)
    otherOpts.logger.warn(
      'The option commandLifetime should not be set to 0 when editResponses is enabled',
    );

  return new _Client(djsOpts, otherOpts);
}

function isClient(value) {
  return value != null && !!value[_clientSymbol];
}

module.exports = {
  client,
  isClient,
};
