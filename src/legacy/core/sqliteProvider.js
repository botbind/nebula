const Provider = require('./provider');

module.exports = function sqliteProvider() {
  return Provider.provider();
};
