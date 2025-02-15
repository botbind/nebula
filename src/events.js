const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const _Resource = require('./internals/_resource');
const _runErrorCustomizer = require('./internals/_runErrorCustomizer');

const _eventSymbol = Symbol('__EVENT__');

class _Event extends _Resource.Resource {
  constructor({ name, ...opts }) {
    super(name);

    this._opts = opts;
  }

  describe() {
    return {
      name: this.name,
      once: this._opts.once,
    };
  }

  async initialize(client, addon) {
    super.initialize(client, addon);

    if (this._opts.initialize !== undefined)
      try {
        await this._opts.initialize(this);
      } catch (err) {
        this.error('event.initialize', { err });
      }
  }

  async run(...args) {
    try {
      await this._opts.run(this, ...args);
    } catch (err) {
      this.error('event.run', { err, args });
    }
  }

  async error(code, ctx) {
    const next = await _runErrorCustomizer(this, 'Event.error', code, ctx);

    if (!next) return;

    if (code === 'event.initialize')
      this.client.logger.error(
        'Cannot run the custom initializer for event',
        this.name,
        'due to',
        ctx.err,
      );

    if (code === 'event.run')
      this.client.logger.error('Cannot run event', this.name, 'due to', ctx.err);
  }
}

Object.defineProperty(_Event.prototype, _eventSymbol, { value: true });

function event(opts = {}) {
  assert(isObject(opts), 'The parameter opts for event must be an object');

  opts = {
    once: false,
    ...opts,
  };

  assert(typeof opts.name === 'string', 'The option name for event must be a string');

  assert(
    typeof opts.once === 'boolean',
    'The option once for event',
    opts.name,
    'must be a boolean',
  );

  assert(
    typeof opts.run === 'function',
    'The option run for event',
    opts.name,
    'must be a function',
  );

  ['initialize', 'error'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option',
      optName,
      'for event',
      opts.name,
      'must be a function',
    ),
  );

  return new _Event(opts);
}

function isEvent(value) {
  return value != null && !!value[_eventSymbol];
}

module.exports = {
  event,
  isEvent,
};
