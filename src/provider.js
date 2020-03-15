const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const _runErrorCustomizer = require('./internals/_runErrorCustomizer');

let isClient;
const _providerSymbol = Symbol('__PROVIDER__');

class _Provider {
  constructor(opts) {
    this.client = null;
    this.opts = opts;
  }

  async initialize(client) {
    // eslint-disable-next-line global-require
    isClient = isClient === undefined ? require('./client').isClient : isClient;

    assert(isClient(client), 'The parameter client for Provider.initialize must be a valid client');

    this.client = client;

    try {
      this.opts.initialize(this);
    } catch (err) {
      // All errors originated from provider are critical
      await this.error('provider.initialize', { err });

      process.exit(1);
    }
  }

  destroy() {
    if (this.opts.destroy !== undefined) this.opts.destroy();
  }

  async error(code, ctx) {
    const next = await _runErrorCustomizer(this, 'Provider.error', code, ctx);

    if (!next) return;

    if (code === 'provider.initialize')
      this.client.logger.error('Cannot run the custom initializer for provider due to', ctx.error);
  }
}

Object.defineProperty(_Provider.prototype, _providerSymbol, { value: true });

function provider(opts = {}) {
  assert(isObject(opts), 'The parameter opts for provider must be an object');

  assert(typeof opts.initialize === 'function', 'The option error for provider must be a function');

  ['error', 'destroy'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option',
      optName,
      'for provider must be a function',
    ),
  );

  return new _Provider(opts);
}

function isProvider(value) {
  return value != null && !!value[_providerSymbol];
}

module.exports = {
  provider,
  isProvider,
};
