const Dust = require('@botbind/dust');

const _providerSymbol = Symbol('__PROVIDER__');

class _Provider {
  constructor() {
    this.client = null;
  }

  create(opts) {
    Dust.assert(Dust.isObject(opts), 'The parameter opts for Provider.create must be an object');

    Dust.assert(
      typeof opts.initialize === 'function',
      'The option initialize for Provider.create must be a function',
    );

    Dust.attachMethod(this, 'initialize', opts.initialize);

    return this;
  }
}

Object.defineProperty(_Provider.prototype, _providerSymbol, { value: true });

function provider() {
  return new _Provider();
}

function isProvider(value) {
  return value != null && value[_providerSymbol];
}

module.exports = { provider, isProvider };
