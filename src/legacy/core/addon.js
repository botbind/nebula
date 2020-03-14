const fs = require('fs').promises;
const nodePath = require('path');
const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');

const _addonSymbol = Symbol('__ADDON__');

class _Addon {
  constructor({ name, ...opts }) {
    this.client = null;
    this.name = name;
    this.opts = opts;

    // Resources
    this.commands = [];
    this.languages = [];
    this.monitors = [];
    this.events = [];
    this.tasks = [];
  }

  async initialize(client) {
    this.client = client;

    for (const type of ['commands', 'languages', 'monitors', 'events', 'tasks']) {
      const path = nodePath.resolve(this.opts.baseDir, type);
      let exists = true;

      // Make a new directory if not exists
      try {
        await fs.access(path);
      } catch (err) {
        exists = false;
      }

      if (!exists) {
        try {
          await fs.mkdir(path, { recursive: true });
        } catch (err) {
          return this.error({ code: 'addon.mkdir', err });
        }
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

        try {
          await resource.initialize(client, this);
        } catch (err) {
          return this.error({ code: 'resource.initialize', err });
        }

        this[type].push(resource);
      }
    }

    if (this.opts.initialize !== undefined) this.opts.initialize(this);
  }

  run(message) {
    if (this.opts.dispatch !== undefined) {
      this.opts.run(this, { message });

      return;
    }

    const prefix = this.client.opts.prefix;
    const content = message.content;

    if (!content.startsWith(prefix)) return;

    const [commandName, ...args] = content.slice(prefix.length).split(/ +/);
    const commands = this.commands.filter(
      command => command.name === commandName || command.alias.includes(commandName),
    );

    if (commands.length === 0) {
      return this.error({ code: 'addon.run.notfound', message });
    }

    for (const command of commands) {
      try {
        command.run(message, args);
      } catch (err) {
        return this.error({ code: 'resource.run', err, message });
      }
    }
  }

  error(helpers) {
    if (this.opts.error) return this.opts.error(this, helpers);

    if (helpers.err !== undefined) throw helpers.err;
  }
}

Object.defineProperty(_Addon.prototype, _addonSymbol, { value: true });

function addon(opts = {}) {
  assert(isObject(opts), 'The parameter opts for addon must be an object');

  opts = {
    public: false,
    ...opts,
  };

  assert(typeof opts.name === 'string', 'The option name for addon must be a string');

  assert(
    typeof opts.baseDir === 'string',
    'The option baseDir for addon',
    opts.name,
    'must be a string',
  );

  assert(
    typeof opts.public === 'boolean',
    'The option public for addon',
    opts.name,
    'must be a boolean',
  );

  ['initialize', 'run', 'error'].forEach(optName =>
    assert(
      opts[optName] === undefined || typeof opts[optName] === 'function',
      'The option',
      optName,
      'for addon',
      opts.name,
      'must be a function',
    ),
  );

  return new _Addon(opts);
}

function isAddon(value) {
  return value != null && !!value[_addonSymbol];
}

module.exports = {
  addon,
  isAddon,
};
