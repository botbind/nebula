const _providerSymbol = Symbol('__PROVIDER__');

class _Provider {
  constructor() {
    this.client = null;
  }

  initialize() {}
}

Object.defineProperty(_Provider.prototype, _providerSymbol, { value: true });

function provider() {
  return new _Provider();
}

function isProvider(value) {
  return value != null && !!value[_providerSymbol];
}

module.exports = { provider, isProvider };
