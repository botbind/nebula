const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const display = require('@botbind/dust/src/display');
const Discord = require('discord.js');
const Addon = require('./addon');
const Colors = require('./colors');
const symbols = require('./symbols');
const _assertErrorParams = require('./internals/_assertErrorParams');

const _clientSymbol = Symbol('__CLIENT__');
// Private addons
const _addons = [];
const _logger = {
  log: _log,
};

for (const [color, method] of [
  ['blue', 'info'],
  ['yellow', 'warn'],
  ['red', 'error'],
  ['green', 'success'],
]) {
  _logger[method] = (...portions) => {
    _log(
      Colors.colors()
        [color]()
        .bold(method),
      ...portions,
    );
  };
}

function _log(...portions) {
  const message = display.portions(...portions);

  if (message.length > 0) console.log(message);
}

class _Client extends Discord.Client {
  constructor({ djsOpts, ...opts }) {
    super(djsOpts);

    if (opts.editResponses && opts.commandLifetime === 0)
      _logger.warn(
        'The option commandLifetime should not be set to 0 when editResponses is enabled',
      );

    this.opts = opts;
    this.logger = _logger;
    this.provider = null;
    this.app = null;
    this.ready = false;
    // Public addons
    this.addons = [];

    this.once('ready', async () => {
      // Fetch app
      try {
        this.app = await this.fetchApplication();
      } catch (err) {
        this.error('client.app', { err });

        // Crit
        process.exit(1);
      }

      const addons = [...this.addons, ..._addons];

      // Initialize addons
      for (const addon of addons) {
        await addon.initialize(this);

        _logger.success('Successfully inject', addon.name);
      }

      if (this.opts.initialize !== undefined)
        try {
          await this.opts.initialize(this);
        } catch (err) {
          this.error('client.initialize', { err });
        }

      this.ready = true;

      this.emit('nebulaReady');

      // Only attach after ready
      this.on('message', async message => {
        if (this.opts.typing) message.channel.startTyping();

        for (const addon of addons) addon.run(message);

        if (this.opts.typing) message.channel.stopTyping();
      });

      // Attach events
      const onceEvents = {};
      const onEvents = {};

      for (const addon of addons)
        for (const event of addon.events) {
          const name = event.name;
          const collection = event.once ? onceEvents : onEvents;

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
    });
  }

  get invite() {
    assert(this.ready, 'Client is not yet ready');

    const perms = new Discord.Permissions(3072);

    for (const addon of [...this.addons, ..._addons])
      for (const command of addon.commands) perms.add(...command.perms);

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

    if (addon.opts.public) this.addons.push(addon);
    else _addons.push(addon);

    return this;
  }

  async error(code, ctx) {
    _assertErrorParams('Client.error', code, ctx);

    if (this.opts.err !== undefined) {
      const result = await this.opts.error(this, code, ctx);

      if (result !== symbols.next) return;
    }

    if (code === 'client.app') _logger.error('Cannot fetch application due to', ctx.err);

    if (code === 'client.initialize')
      _logger.error('Cannot run the custom initializer for client due to', ctx.err);
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
    ...opts,
  };

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

  ['initialize', 'error'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option error for client must be a function',
    ),
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
