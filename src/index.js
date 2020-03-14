/* eslint-disable global-require */
require('./bootstrap');
const Lang = require('./lang');

module.exports = {
  ...require('./client'),
  ...require('./colors'),
  ...require('./addon'),
  ...require('./command'),
  ...require('./events'),
  ...Lang,
  language: Lang.lang,
  isLanguage: Lang.isLang,
  symbols: require('./symbols'),
};
