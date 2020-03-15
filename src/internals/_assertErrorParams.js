const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');

module.exports = function _assertErrorParams(methodName, code, ctx) {
  assert(typeof code === 'string', 'The parameter code for', methodName, 'must be a string');

  assert(isObject(ctx), 'The parameter ctx for', methodName, 'must be an object');
};
