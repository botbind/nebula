const sqlite3 = require('sqlite3').verbose();
const { provider } = require('./provider');

module.exports = function sqliteProvider() {
  return provider().create({
    initialize() {
      const baseDir = this.client.opts.baseDir;
      const db = new sqlite3.Database(`${baseDir}/db`);

      this.db = db;

      db.run('CREATE TABLE IF NOT EXISTS global (prefix TEXT, owner TEXT)');
    },
    update() {},
  });
};
