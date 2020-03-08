const Dust = require('@botbind/dust');
const { colors } = require('./colors');

const _loggerSymbol = Symbol('__LOGGER__');

class _Logger {
  log(...portions) {
    const message = Dust.display.portions(...portions);

    if (message.length > 0) console.log(message);
  }

  info(...portions) {
    this.log(
      colors()
        .blue()
        .bold('[Info]'),
      ...portions,
    );
  }

  warn(...portions) {
    this.log(
      colors()
        .yellow()
        .bold('[Warn]'),
      ...portions,
    );
  }

  error(...portions) {
    this.log(
      colors()
        .red()
        .bold('[Error]'),
      ...portions,
    );
  }

  success(...portions) {
    this.log(
      colors()
        .green()
        .bold('[Success]'),
      ...portions,
    );
  }

  extend(opts) {
    Dust.assert(Dust.isObject(opts), 'The parameter opts for Logger.extend must be an object');

    const newLogger = new _Logger();

    for (const key of Object.keys(opts)) {
      Dust.assert(
        key === 'log' || key === 'info' || key === 'warn' || key === 'error' || key === 'success',
        key,
        "is not a valid Logger's method",
      );

      const method = opts[key];

      Dust.assert(
        typeof method === 'function',
        'The option',
        key,
        'for Logger.extend must be a function',
      );

      Dust.attachMethod(newLogger, key, method);
    }

    return newLogger;
  }
}

Object.defineProperty(_Logger.prototype, _loggerSymbol, { value: true });

function logger() {
  return new _Logger();
}

function isLogger(value) {
  return value != null && !!value[_loggerSymbol];
}

module.exports = {
  logger,
  isLogger,
};
