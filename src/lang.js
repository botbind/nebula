const assert = require('@botbind/dust/src/assert');
const display = require('@botbind/dust/src/display');
const isObject = require('@botbind/dust/src/isObject');
const clone = require('@botbind/dust/src/clone');
const get = require('@botbind/dust/src/get');
const _Resource = require('./internals/_resource');

const _langSymbol = Symbol('__EVENT__');
const _defaultSymbol = Symbol('__DEFAULT__');

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

  render(key, terms = {}) {
    assert(typeof key === 'string', 'The parameter key for Lang.render must be a string');

    assert(isObject(terms), 'The parameter local for Lang.render must be an object');

    const template = this._dictionary[key];

    assert(template !== undefined, 'Template for key', key, 'not found');

    return template.replace(/{([a-zA-z0-9]+)}/g, (_, match) => {
      const found = get(terms, match, { default: _defaultSymbol });

      assert(found !== _defaultSymbol, 'Term', match, 'not found');

      return display(found);
    });
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
