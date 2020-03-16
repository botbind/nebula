const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const path = require('path');
const fs = require('fs').promises;
const _Resource = require('./internals/_resource');
const _runCommands = require('./internals/_runCommands');
const _assertDiscord = require('./internals/_assertDiscord');
const _runErrorCustomizer = require('./internals/_runErrorCustomizer');

let isClient;
const _addonSymbol = Symbol('__ADDON__');
const _types = ['commands', 'tasks', 'events'];

class _Addon {
  constructor({ name, ...opts }) {
    this._opts = opts;

    this.client = null;
    this.name = name;
    this.vars = {}; // Addon-specific variable container

    // Resources
    this.lang = null;

    for (const type of _types) this[type] = [];
  }

  describe() {
    const desc = {};

    desc.name = this.name;

    for (const type of _types)
      if (this[type].length > 0) desc[type] = this[type].map(resource => resource.describe());

    if (this.lang !== null) desc.lang = this.lang.describe();

    return desc;
  }

  async initialize(client) {
    // eslint-disable-next-line global-require
    isClient = isClient === undefined ? require('./client').isClient : isClient;

    assert(isClient(client), 'The parameter client for Addon.initialize must be a valid client');

    this.client = client;

    for (const type of [..._types, 'languages']) {
      const isLang = type === 'languages';
      const folderPath = path.resolve(this._opts.baseDir, type);
      let folderStat;

      try {
        folderStat = await fs.lstat(folderPath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          await this.error('addon.lstat', { err, path: folderPath });

          process.exit(1);
        }
      }

      if (folderStat === undefined)
        try {
          await fs.mkdir(folderPath, { recursive: true });
        } catch (err) {
          await this.error(err, 'addon.mkdir', { err, path: folderPath });

          process.exit(1);
        }
      else if (folderStat.isFile()) {
        // Critical
        await this.error('addon.isFile', { path: folderPath });

        process.exit(1);
      }

      let filenames = await fs.readdir(folderPath);

      filenames = filenames.filter(filename => {
        const ext = path.extname(filename);

        return ext === '.js' || ext === '.ts';
      });

      for (const filename of filenames) {
        const filePath = path.resolve(folderPath, filename);
        let fileStat;

        try {
          fileStat = await fs.lstat(filePath);
        } catch (err) {
          // Critical
          await this.error('addon.lstat', { err, path: filePath });

          process.exit(1);
        }

        if (fileStat.isDirectory()) continue;

        // eslint-disable-next-line
        const req = require(filePath);
        const resource = req.__esModule ? req.default : req;

        assert(
          _Resource.isResource(resource),
          'The resource of path',
          filePath,
          'must be valid resource',
        );

        if (isLang && resource.name !== this.client._opts.lang) continue;

        await resource.initialize(client, this);

        if (isLang) {
          this.lang = resource;

          break;
        }

        this[type].push(resource);
      }
    }

    if (this._opts.initialize !== undefined)
      try {
        await this._opts.initialize(this);
      } catch (err) {
        this.error('addon.initialize', { err });
      }
  }

  async run(message) {
    _assertDiscord.message('Addon.run', message);

    if (this._opts.run !== undefined) {
      this._opts.run(this, message);

      return;
    }

    const prefix = this.client.provider.get('prefix');
    const content = message.content;

    if (!content.startsWith(prefix) || message.author.bot) return;

    const [name, ...args] = content.slice(prefix.length).split(/ +/);
    const notFound = await _runCommands(message, name, args, this.commands);

    if (notFound) this.error('addon.commandNotFound', { name, args, message });
  }

  async error(code, ctx) {
    const next = await _runErrorCustomizer(this, 'Addon.error', code, ctx);

    if (!next) return;

    if (code === 'addon.lstat')
      this.client.logger.error('Cannot retrieve status of path', ctx.path, 'due to', ctx.err);

    if (code === 'addon.mkdir')
      this.client.logger.error('Cannot make path,', ctx.path, 'due to', ctx.err);

    if (code === 'addon.isFile')
      this.client.logger.error('Path ', ctx.path, 'must be a folder instead of a file');

    if (code === 'addon.initialize')
      this.client.logger.error(
        'Cannot run the custom initializer for addon',
        this.name,
        'due to',
        ctx.err,
      );

    if (code === 'addon.commandNotFound')
      ctx.message.channel.send(`Command ${ctx.name} not found. Please try again`);
  }
}

Object.defineProperty(_Addon.prototype, _addonSymbol, { value: true });

function addon(opts = {}) {
  assert(isObject(opts), 'The parameter opts for addon must be an object');

  opts = {
    public: true,
    ...opts,
  };

  assert(typeof opts.name === 'string', 'The option name for addon must be a string');

  assert(
    typeof opts.public === 'boolean',
    'The option public for addon',
    opts.name,
    'must be a boolean',
  );

  assert(
    typeof opts.baseDir === 'string',
    'The option baseDir for addon',
    opts.name,
    'must be a string',
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
