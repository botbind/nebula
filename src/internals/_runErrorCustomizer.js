const assert = require('@botbind/dust/src/assert');
const isObject = require('@botbind/dust/src/isObject');
const symbols = require('../symbols');

module.exports = async function _runErrorCustomizer(structure, methodName, code, ctx) {
  assert(typeof code === 'string', 'The parameter code for', methodName, 'must be a string');

  assert(isObject(ctx), 'The parameter ctx for', methodName, 'must be an object');

  if (structure.opts.error !== undefined) {
    const result = await structure.opts.error(structure, code, ctx);

    return result === symbols.next;
  }

  return true;
};
