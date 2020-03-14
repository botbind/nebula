/* eslint-disable global-require */
module.exports = {
  ...require('./client'),
  ...require('./colors'),
  ...require('./addon'),
  ...require('./command'),
  ...require('./provider'),
  sqliteProvider: require('./sqliteProvider'),
};
