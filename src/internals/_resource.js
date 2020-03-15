const assert = require('@botbind/dust/src/assert');

let isClient;
let isAddon;

const _resourceSymbol = Symbol('__RESOURCE__');

class _Resource {
  constructor(name) {
    this.name = name;
    this.vars = {};
    this.client = null;
    this.addon = null;
  }

  describe() {
    return {};
  }

  initialize(client, addon) {
    /* eslint-disable global-require */
    isClient = isClient === undefined ? require('../client').isClient : isClient;
    isAddon = isAddon === undefined ? require('../addon').isAddon : isAddon;
    /* eslint-enable global-require */

    assert(isClient(client), 'The parameter client for Resource.initialize must be a valid client');

    assert(isAddon(addon), 'The parameter addon for Resource.initialize must be a valid addon');

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
