const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const clone = require('@botbind/dust/src/clone');
const _Resource = require('./internals/_resource');

const _langSymbol = Symbol('__EVENT__');

class _Lang extends _Resource.Resource {
  constructor({ name, dictionary }) {
    super(name);

    this._dictionary = dictionary;
  }

  describe() {
    return {
      name: this.name,
      dictionary: clone(this._dictionary),
    };
  }

  render(term, local = {}) {
    assert(typeof term === 'string', 'The parameter term for Lang.render must be a string');

    assert(isObject(local), 'The parameter local for Lang.render must be an object');

    const definition = this._dictionary[term];

    assert(definition !== undefined, 'Definition for term', term, 'not found');

    // TODO: populate locals
    return definition;
  }
}

Object.defineProperty(_Lang.prototype, _langSymbol, { value: true });

function lang(opts = {}) {
  assert(isObject(opts), 'The parameter opts for lang must be an object');

  assert(typeof opts.name === 'string', 'The option name for lang must be a string');

  assert(
    isObject(opts.dictionary),
    'The option dictionary for lang',
    opts.name,
    'must be an object',
  );

  return new _Lang(opts);
}

function isLang(value) {
  return value != null && !!value[_langSymbol];
}

module.exports = {
  lang,
  isLang,
};
