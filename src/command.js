const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const clone = require('@botbind/dust/src/clone');
const L = require('@botbind/lyra');
const Discord = require('discord.js');
const symbols = require('./symbols');
const _Resource = require('./internals/_resource');
const _runCommands = require('./internals/_runCommands');
const _assertDiscord = require('./internals/_assertDiscord');
const _assertErrorParams = require('./internals/_assertErrorParams');

const _commandSymbol = Symbol('__COMMAND__');

class _CooldownEntry {
  constructor(threshold) {
    this.timestamp = Date.now();
    this.threshold = threshold;
    this.remainingTime = null;
  }

  get active() {
    const diff = Date.now() - this.timestamp;

    if (diff <= this.threshold) {
      this.remainingTime = this.threshold - diff;

      return true;
    }

    return false;
  }
}

function _nameFromScope(scope) {
  return `_${scope}s`;
}

function _isValidScope(scope) {
  return scope === 'user' || scope === 'guild';
}

function _idFromScope(message, scope) {
  return scope === 'user' ? message.author.id : message.guild.id;
}

class _Cooldowns {
  constructor() {
    this._users = {};
    this._guilds = {};
  }

  add(message, threshold, scope = 'user') {
    _assertDiscord.message('Cooldowns.add', message);

    assert(
      typeof threshold === 'number',
      'The parameter threshold for Cooldowns.add must be a number greater than 0',
    );

    assert(
      _isValidScope(scope),
      'The parameter scope for Cooldowns.add must be either user or guild',
    );

    this[_nameFromScope(scope)][_idFromScope(message, scope)] = new _CooldownEntry(threshold);

    return this;
  }

  reset(scope) {
    assert(
      scope === undefined || _isValidScope(scope),
      'The parameter scope for Cooldowns.reset must be either user or guild',
    );

    if (scope === undefined) {
      this._users = {};
      this._guilds = {};

      return this;
    }

    this[_nameFromScope(scope)] = {};

    return this;
  }

  remove(message, scope = 'user') {
    _assertDiscord.message('Cooldowns.remove', message);

    assert(
      _isValidScope(scope),
      'The parameter scope for Cooldowns.remove must be either user or guild',
    );

    delete this[_nameFromScope(scope)][_idFromScope(message, scope)];
  }

  active(message) {
    _assertDiscord.message('Cooldowns.check', message);

    for (const scope of ['user', 'guild']) {
      const entry = this[_nameFromScope(scope)][_idFromScope(message, scope)];

      if (entry !== undefined && entry.active) return entry;

      this.remove(message, scope);
    }

    return false;
  }
}

class _Command extends _Resource.Resource {
  constructor({ name, description, alias, ...opts }) {
    super(name);

    this.description = description;
    this.alias = alias;
    this.opts = opts;

    this.cooldowns = new _Cooldowns();
  }

  describe() {
    const desc = {};

    desc.name = this.name;
    desc.description = this.description;

    if (this.alias.length > 0) desc.alias = clone(this.alias);

    if (this.opts.args !== undefined) desc.args = this.opts.args.describe();

    if (this.opts.subcommands.length > 0)
      desc.subcommands = this.opts.subcommands.map(subcommand => subcommand.describe());

    return desc;
  }

  async initialize(client, addon) {
    super.initialize(client, addon);

    for (const subcommand of this.opts.subcommands) await subcommand.initialize(client, addon);

    if (this.opts.initialize !== undefined)
      try {
        await this.opts.initialize(this);
      } catch (err) {
        this.error('command.initialize', { err });
      }
  }

  async run(message, args) {
    _assertDiscord.message('Command.run', message);

    assert(Array.isArray(args), 'The parameter args for Command.run must be an array');

    // Cooldown
    const entry = this.cooldowns.active(message);

    if (entry) {
      this.error('command.cooldown', { message, remainingTime: entry.remainingTime });

      return;
    }

    if (this.opts.args !== undefined) {
      const desc = this.opts.args.describe();

      if (desc.type !== 'array' || desc.type === 'object') args = args[0];

      if (desc.type === 'object') {
        const argObj = {};

        for (let i = 0; i < desc.keys.length; i++) {
          argObj[desc.keys[i][0]] = args[i];
        }

        args = argObj;
      }

      const result = this.opts.args.validate(args, {
        context: {
          message,
        },
      });

      if (result.errors !== null) {
        for (const err of result.errors) {
          this.error('command.args', { err, args, message });
        }

        return;
      }

      args = result.value;
    }

    if (this.opts.subcommands.length > 0) {
      const name = args.shift();

      const notFound = await _runCommands(message, name, args, this.opts.subcommands);

      if (notFound) this.error('command.subcommandNotFound', { message, name, args });

      return;
    }

    if (this.opts.run !== undefined)
      try {
        await this.opts.run(this, message, args);
      } catch (err) {
        this.error('command.run', { err, message });
      }
  }

  async error(code, ctx) {
    _assertErrorParams('Command.error', code, ctx);

    if (this.opts.error !== undefined) {
      const result = await this.opts.error(this, code, ctx);

      if (result !== symbols.next) return;
    }

    if (code === 'command.initialize')
      this.client.logger.error(
        'Cannot run the custom initializer for command',
        this.name,
        'due to',
        ctx.err,
      );

    if (code === 'command.cooldown')
      ctx.message.channel.send(`Command is cooling down. Time left: ${ctx.remainingTime / 1000}s`);

    if (code === 'command.args') ctx.message.channel.send(ctx.err.message);

    if (code === 'command.subcommandNotFound') {
      if (ctx.name === undefined) {
        ctx.message.channel.send('Please enter the subcommand name');

        return;
      }

      ctx.message.channel.send(`Subcommand ${ctx.name} not found. Please try again`);
    }

    if (code === 'command.run') {
      ctx.message.channel.send(`Cannot run command ${this.name} due to internal errors`);
      this.client.logger.error('Cannot run command', this.name, 'due to', ctx.err);
    }
  }
}

Object.defineProperty(_Command.prototype, _commandSymbol, { value: true });

function command(opts = {}) {
  assert(isObject(opts), 'The parameter opts for command must be an object');

  opts = {
    description: 'No description available',
    alias: [],
    perms: [],
    subcommands: [],
    ...opts,
  };

  assert(typeof opts.name === 'string', 'The option name for command must be a string');

  assert(
    typeof opts.description === 'string',
    'The option description for command',
    opts.name,
    'must be a string',
  );

  assert(
    Array.isArray(opts.alias) && opts.alias.every(alias => typeof alias === 'string'),
    'The option alias for command',
    opts.name,
    'must be an array of strings',
  );

  assert(
    opts.args === undefined || L.isSchema(opts.args),
    'The option args for command',
    opts.name,
    'must be a valid schema',
  );

  assert(
    opts.perms.every(perm => Discord.Permissions.FLAGS[perm] !== undefined),
    'The option perms for command must be a valid Discord permission',
  );

  assert(
    Array.isArray(opts.subcommands) && opts.subcommands.every(subcommand => isCommand(subcommand)),
    'The option subcommands must be an array of commands',
  );

  ['initialize', 'run', 'error'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option',
      optName,
      'for addon',
      opts.name,
      'must be a function',
    ),
  );

  assert(
    opts.subcommands.length === 0 || (opts.args === undefined && opts.run === undefined),
    'The option subcommands for command must not be defined with args and run',
  );

  return new _Command(opts);
}

function isCommand(value) {
  return value != null && !!value[_commandSymbol];
}

module.exports = {
  command,
  isCommand,
};
