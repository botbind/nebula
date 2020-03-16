/* eslint-disable global-require */
require('./bootstrap');
const Lang = require('./lang');

module.exports = {
  ...require('./client'),
  ...require('./colors'),
  ...require('./addon'),
  ...require('./command'),
  ...require('./events'),
  ...require('./provider'),
  ...require('./logger'),
  ...Lang,
  language: Lang.lang,
  isLanguage: Lang.isLang,
  jsonProvider: require('./jsonProvider'),
  symbols: require('./symbols'),
};
