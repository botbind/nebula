const L = require('@botbind/lyra');
const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');

const _commandSymbol = Symbol('__COMMAND__');

function _generateUsageString(prefix, name, argSchema) {
  const usage = `${prefix}${name}`;

  if (argSchema === undefined) return usage;

  const { type, flags } = argSchema.describe();

  // Defaults
  let label = 'unknown';
  let presence = 'optional';

  if (flags !== undefined) {
    if (flags.label !== undefined) label = flags.label;

    if (flags.presence !== undefined) presence = flags.presence;
  }

  return `${usage} [${label}:${type}] (${presence})`;
}

class _Command {
  constructor({ name, alias, ...opts }) {
    this.client = null;
    this.addon = null;
    this.usage = null;
    this.name = name;
    this.alias = alias;
    this.opts = opts;
  }

  async initialize(client, addon) {
    this.client = client;
    this.addon = addon;
    this.usage = _generateUsageString(client.prefix, this.name, this.opts.args);
  }

  run(message, args) {
    const argSchema = this.opts.args;

    if (argSchema !== undefined) {
      const desc = argSchema.describe();

      if (desc.type !== 'array' || desc.type !== 'object') args = args[0];

      if (desc.type === 'object') {
        const argObj = {};

        for (let i = 0; i < desc.keys.length; i++) {
          argObj[desc.keys[i][0]] = args[i];
        }

        args = argObj;
      }

      const result = argSchema.validate(args);

      if (result.errors !== null) {
        for (const err of result.errors) {
          this.error({ code: 'command.run', err, message });
        }

        return;
      }

      args = result.value;
    }

    if (this.opts.run !== undefined) this.opts.run(this, { message, args });
  }

  error(helpers) {
    if (this.opts.error !== undefined) return this.opts.error(this, helpers);

    if (helpers.err !== undefined) throw helpers.err;
  }
}

function command(opts = {}) {
  assert(isObject(opts), 'The parameter opts for command must be an object');

  opts = {
    alias: [],
    ...opts,
  };

  assert(typeof opts.name === 'string', 'The option name for command must be a string');

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

  ['initialize', 'run', 'error'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option',
      optName,
      'for command',
      opts.name,
      'must be a function',
    ),
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
