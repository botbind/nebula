const _resourceSymbol = Symbol('__RESOURCE__');

class _Resource {
  constructor(name) {
    this.name = name;
    this.client = null;
    this.addon = null;
  }

  describe() {
    return {};
  }

  initialize(client, addon) {
    this.client = client;
    this.addon = addon;
  }
}

Object.defineProperty(_Resource.prototype, _resourceSymbol, { value: true });

function isResource(value) {
  return value != null && !!value[_resourceSymbol];
}

module.exports = {
  Resource: _Resource,
  isResource,
};
