const fs = require('fs').promises;
const nodePath = require('path');
const Dust = require('@botbind/dust');

const _addonSymbol = Symbol('__ADDON__');
const _resourceTypes = ['commands'];

class _Addon {
  constructor(opts) {
    Dust.assert(Dust.isObject(opts), 'The parameter opts for addon must be an object');

    const { name, dispatch, ...actualOpts } = {
      public: false,
      ...opts,
    };

    Dust.assert(typeof name === 'string', 'The option name for addon must be a string');

    Dust.assert(
      typeof actualOpts.baseDir === 'string',
      'The option baseDir for addon',
      name,
      'must be a string',
    );

    Dust.assert(
      typeof actualOpts.public === 'boolean',
      'The option public for addon',
      name,
      'must be a boolean',
    );

    const hasDispatch = dispatch !== undefined;

    Dust.assert(
      !hasDispatch || typeof dispatch === 'function',
      'The option dispatch for addon mustbe a function',
    );

    if (hasDispatch) Dust.attachMethod(this, 'dispatch', dispatch);

    this.client = null;
    this.name = name;
    this.opts = actualOpts;
    this.commands = [];
  }

  async initialize() {
    for (const type of _resourceTypes) {
      const path = nodePath.resolve(this.opts.baseDir, type);

      // Make a new directory if not exists
      try {
        await fs.access(path);
      } catch (err) {
        await fs.mkdir(path, { recursive: true });
      }

      // Read the content of the folder
      const filenames = await fs.readdir(path);

      const resourceNames = filenames.filter(filename => {
        const ext = nodePath.extname(filename);

        return ext === '.js' || ext === '.ts';
      });

      // Loop through all the filtered files
      for (const resourceName of resourceNames) {
        const resourcePath = nodePath.resolve(path, resourceName);
        const stats = await fs.lstat(resourcePath);

        if (stats.isDirectory()) continue;

        // eslint-disable-next-line
        const req = require(resourcePath);
        const resource = req.__esModule ? req.default : req;

        resource.client = this.client;
        resource.addon = this;

        await resource.initialize();

        this[type].push(resource);
      }
    }
  }

  dispatch(message) {
    const prefix = this.client.opts.prefix;
    const content = message.content;

    if (!content.startsWith(prefix)) return;

    const command = content.slice(prefix.length);
    const commands = this.commands.filter(
      ({ name, alias }) => name === command || alias.includes(command),
    );

    for (const foundCommand of commands) foundCommand.dispatch(message);
  }
}

Object.defineProperty(_Addon.prototype, _addonSymbol, { value: true });

function addon(opts = {}) {
  return new _Addon(opts);
}

function isAddon(value) {
  return value != null && !!value[_addonSymbol];
}

module.exports = {
  addon,
  isAddon,
};
