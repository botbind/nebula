const assert = require('@botbind/dust/src/assert');
const attachMethod = require('@botbind/dust/src/attachMethod');
const isObject = require('@botbind/dust/src/isObject');
const display = require('@botbind/dust/src/display');
const Colors = require('./colors');

const _loggerSymbol = Symbol('__LOGGER__');
const _methods = [
  ['log'],
  ['info', 'blue'],
  ['warn', 'yellow'],
  ['error', 'red'],
  ['success', 'green'],
];

class _Logger {
  constructor(opts) {
    this._opts = opts;
  }
}

for (const [methodName, color] of _methods)
  attachMethod(_Logger.prototype, methodName, function method(...portions) {
    const message = display.portions(...portions);

    if (message.length === 0) return this;

    if (this._opts[methodName] !== undefined) {
      this._opts[methodName](this, message);
    }

    if (color !== undefined)
      portions.unshift(
        Colors.colors()
          [color]()
          .bold(methodName),
      );

    console.log(...portions);

    return this;
  });

Object.defineProperty(_Logger.prototype, _loggerSymbol, { value: true });

function logger(opts = {}) {
  assert(isObject(opts), 'The parameter opts for logger must be an object');

  _methods.forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option',
      optName,
      'for logger must be a function',
    ),
  );

  return new _Logger(opts);
}

function isLogger(value) {
  return value != null && !!value[_loggerSymbol];
}

module.exports = {
  logger,
  isLogger,
};
