const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const equal = require('@botbind/dust/src/equal');
const clone = require('@botbind/dust/src/clone');
const get = require('@botbind/dust/src/get');
const set = require('@botbind/dust/src/set');
const Discord = require('discord.js');
const Addon = require('./addon');
const Logger = require('./logger');
const Adapter = require('./adapter');
const JSONAdapter = require('./JSONAdapter');
const Lyra = require('./lyra');
const _runErrorCustomizer = require('./internals/_runErrorCustomizer');

const _addons = new WeakMap(); // Stores active private addons, mapped by their clients
const _adapters = new WeakMap(); // Stores active adapters, mapped by their clients
const _cache = new WeakMap(); // Stores active cache, mapped by their clients
const _symbols = {
  client: Symbol('__CLIENT__'),
};

function _getSetParams(methodName, path, opts) {
  assert(typeof path === 'string', 'The parameter path for', methodName, 'must be a string');

  assert(isObject(opts), 'The parameter opts for', methodName, 'must be an object');

  assert(
    opts.separator === undefined || typeof opts.separator === 'string',
    'The option separator for Storage.set must be a string',
  );
}

function _getCache(activeClient, name) {
  const cache = _cache.get(activeClient);

  if (cache[name] === undefined) {
    cache[name] = {};
  }

  return cache[name];
}

class _Storage {
  constructor(activeClient, name, schema) {
    this.client = activeClient;
    this.name = name;
    this._schema = schema;
  }

  extend(schema) {
    this._schema = this._schema.merge(Lyra.compile(schema));
  }

  async set(path, value, opts = {}) {
    _getSetParams('Storage.set', path, opts);

    assert(
      opts.action === undefined ||
        opts.action === 'add' ||
        opts.action === 'remove' ||
        opts.action === 'override',
      'The option action for Storage.set must be override, add or remove',
    );

    const cache = _getCache(this.client, this.name);
    const action = opts.action;

    // Discard other options
    opts = { separator: opts.separator };

    const schema = this._schema.extract(path, opts);

    assert(schema !== undefined, 'Path', path, 'not found');

    const result = schema.validate(value, { context: { path, value } });

    // Always throw the first error, abortEarly ignored
    if (result.errors !== null) throw result.errors[0];

    value = result.value;

    const currValue = this.get(cache, path, opts);

    if (action === undefined || action === 'override') {
      if (equal(currValue, value)) return;
    } else if (Array.isArray(currValue)) {
      value = Array.isArray(value) ? value : [value];

      if (action === 'add') value = currValue.concat(...value);
      else
        value = currValue.filter(subCurrValue =>
          value.every(subValue => !equal(subCurrValue, subValue)),
        );
    } else if (action === 'add') {
      value = { ...currValue, ...value };
    } else {
      const keys = Array.isArray(value) ? value : Object.keys(value);

      value = currValue;

      for (const key of keys) delete value[key];
    }

    if (equal(currValue, value)) return;

    set(cache, path, value, opts);

    await _adapters.get(this.client).save({ name: this.name, cache, path, value });
  }

  async add(path, value, opts = {}) {
    await this.set(path, value, { ...opts, action: 'add' });
  }

  async delete(path, value, opts = {}) {
    await this.set(path, value, { ...opts, action: 'delete' });
  }

  get(path, opts = {}) {
    _getSetParams('Storage.get', path, opts);

    assert(
      opts.query === undefined ||
        typeof opts.query === 'function' ||
        typeof opts.query === 'string',
      'The option query for Storage.get must be a function or a string',
    );

    const cache = _getCache(this.client, this.name);
    const query = opts.query;

    opts = { separator: opts.separator };

    const value = clone(get(cache, path, opts)); // clone the returned cache

    if (query === undefined) return value;

    if (Array.isArray(value)) {
      if (typeof query === 'string') return value.find(subValue => get(subValue, query, opts));

      return value.find(query);
    }

    if (typeof query === 'string') return get(value, query, opts);

    for (const key of Object.keys(value)) {
      const subValue = value[key];

      if (query(key, subValue)) return subValue;
    }

    return undefined;
  }
}

class _Storages {
  constructor(activeClient) {
    this.client = activeClient;
    this._storages = {};
  }

  extend(name, schema) {
    assert(typeof name === 'string', 'The parameter name for Storages.extend must be a string');

    assert(this._storages[name] !== undefined, 'Storage', name, 'not found');

    this._storages[name].extend(schema);
  }

  register(name, schema) {
    assert(typeof name === 'string', 'The parameter name for Storages.register must be a string');

    assert(this._storages[name] === undefined, 'Storage', name, 'has already been registered');

    schema = Lyra.compile(schema);

    assert(
      schema.type === 'object',
      'The parameter schema for Storage.register must be an object schema',
    );

    const storage = new _Storage(this.client, name, schema);

    this._storages[name] = storage;

    return storage;
  }

  get(name) {
    assert(typeof name === 'string', 'The parameter name for Storages.get must be a string');

    return this._storages[name];
  }
}

class _Client extends Discord.Client {
  constructor({ djsOpts, prefix, logger = Logger.logger(), adapter = JSONAdapter, ...opts }) {
    super(djsOpts);

    _adapters.set(this, adapter);
    _addons.set(this, []);

    this._opts = opts;

    this.storages = null;
    this.storage = null;
    this.logger = logger;
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

      await adapter.initialize(this); // Adapter

      const cache = await adapter.load(); // Cache

      _cache.set(this, cache);

      this.storages = new _Storages(this);
      this.storage = this.storages.register('global', {
        prefix: Lyra.str().default('!'),
      });

      for (const type of ['members', 'users', 'guilds'])
        this.storages.register(type, Lyra.obj().pattern(Lyra.discord().snowflake()));

      await this.storage.set('prefix', prefix);

      const addons = [...this.addons, ..._addons.get(this)];

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
          const collection = /* Defeaults to  false */ event._opts.once ? onceEvents : onEvents;

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
        if (/* Defaults to false */ this._opts.typing) message.channel.startTyping();

        for (const addon of addons) addon.run(message);

        if (this._opts.typing) message.channel.stopTyping();
      });
    });
  }

  get invite() {
    assert(this.ready, 'Client is not ready');

    const perms = new Discord.Permissions(3072);

    for (const addon of [...this.addons, ..._addons.get(this)])
      for (const command of addon.commands)
        if (command._opts.perms !== undefined) perms.add(...command._opts.perms);

    return `https://discordapp.com/oauth2/authorize?client_id=${this.app.id}&permissions=${perms.bitfield}&scope=bot`;
  }

  get owner() {
    assert(this.ready, 'Client is not ready');

    if (this.app.owner === null) return undefined;

    return this.users.cache.get(this.app.owner.id);
  }

  describe() {
    const addons = [...this.addons, ..._addons.get(this)];
    const desc = {};

    if (addons.length > 0) desc.addons = addons.map(addon => addon.describe());

    return desc;
  }

  inject(addon, opts) {
    if (typeof addon === 'function') addon = addon(opts);

    assert(Addon.isAddon(addon), 'The parameter addon for Client.inject must be a valid addon');

    if (/* Defaults to true */ addon._opts.public !== false) this.addons.push(addon);
    else _addons.get(this).push(addon);

    return this;
  }

  destroy() {
    this.adapter.destroy();
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

Object.defineProperty(_Client.prototype, _symbols.client, { value: true });

function client(opts = {}) {
  assert(isObject(opts), 'The parameter opts for client must be an object');

  assert(typeof opts.baseDir === 'string', 'The option baseDir for client must be a string');

  for (const key of ['prefix', 'lang'])
    assert(
      opts[key] === undefined || typeof opts[key] === 'string',
      'The option',
      key,
      'for client must be a string',
    );

  for (const key of ['typing', 'editResponses'])
    assert(
      opts[key] === undefined || typeof opts[key] === 'boolean',
      'The option',
      key,
      'for client must be a boolean',
    );

  assert(
    opts.commandLifetime === undefined || typeof opts.commandLifetime === 'number',
    'The option commandLifetime for client must be a number',
  );

  assert(
    opts.logger === undefined || Logger.isLogger(opts.logger),
    'The option logger for client must be a valid logger',
  );

  assert(
    opts.adapter === undefined || Adapter.isAdapter(opts.adapter),
    'The option adapter for client must be a valid adapter',
  );

  assert(
    !opts.editResponses || opts.commandLifetime !== 0,
    'The option commandLifetime for client must not be 0 when editResponses is enabled',
  );

  for (const key of ['initialize', 'error'])
    assert(
      opts[key] === undefined || typeof opts[key] === 'function',
      'The option',
      key,
      'for client must be a function',
    );

  return new _Client(opts);
}

function isClient(value) {
  return value != null && !!value[_symbols.client];
}

module.exports = {
  client,
  isClient,
};
