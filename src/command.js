const Dust = require('@botbind/dust');

const _commandSymbol = Symbol('__COMMAND__');

class _Command {
  constructor(opts) {
    Dust.assert(Dust.isObject(opts), 'The parameter opts for command must be an object');

    const { name, alias: aliases, dispatch, initialize } = {
      alias: [],
      initialize: () => {},
      ...opts,
    };

    Dust.assert(typeof name === 'string', 'The option name for command must be a string');

    Dust.assert(
      Array.isArray(aliases) && aliases.every(alias => typeof alias === 'string'),
      'The option alias for command',
      name,
      'must be an array of strings',
    );

    Dust.assert(
      typeof dispatch === 'function',
      'The option dispatch for command',
      name,
      'must be a function',
    );

    Dust.assert(
      typeof initialize === 'function',
      'The option initialize for command',
      name,
      'must be a function',
    );

    this.client = null;
    this.addon = null;
    this.name = name;
    this.alias = aliases;
    this.initialize = initialize;
    this.dispatch = dispatch;
  }
}

function command(opts = {}) {
  return new _Command(opts);
}

function isCommand(value) {
  return value != null && !!value[_commandSymbol];
}

module.exports = {
  command,
  isCommand,
};
