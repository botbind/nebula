const Dust = require('@botbind/dust');

const _colorsSymbol = Symbol('__COLORS__');

class _Colors {
  constructor() {
    // Avoid duplicate styles
    this._styles = new Set();
  }
}

Object.defineProperty(_Colors.prototype, _colorsSymbol, { value: true });

// Copied from https://github.com/Marak/colors.js/blob/master/lib/styles.js
const _colors = [
  ['reset'],
  ['bold', [1, 22]],
  ['dim', [2, 22]],
  ['italic', [3, 23]],
  ['underline', [4, 24]],
  ['inverse', [7, 27]],
  ['hidden', [8, 28]],
  ['strikethrough', [9, 29]],
  ['black', [30, 39]],
  ['red', [31, 39]],
  ['green', [32, 39]],
  ['yellow', [33, 39]],
  ['blue', [34, 39]],
  ['magenta', [35, 39]],
  ['cyan', [36, 39]],
  ['white', [37, 39]],
  ['grey', [90, 39]],
  ['brightRed', [91, 39]],
  ['brightGreen', [92, 39]],
  ['brightYellow', [93, 39]],
  ['brightBlue', [94, 39]],
  ['brightMagenta', [95, 39]],
  ['brightCyan', [96, 39]],
  ['brightWhite', [97, 39]],
  ['bgBlack', [40, 49]],
  ['bgRed', [41, 49]],
  ['bgGreen', [42, 49]],
  ['bgYellow', [43, 49]],
  ['bgBlue', [44, 49]],
  ['bgMagenta', [45, 49]],
  ['bgCyan', [46, 49]],
  ['bgWhite', [47, 49]],
  ['bgBrightRed', [101, 49]],
  ['bgBrightGreen', [102, 49]],
  ['bgBrightYellow', [103, 49]],
  ['bgBrightBlue', [104, 49]],
  ['bgBrightMagenta', [105, 49]],
  ['bgBrightCyan', [106, 49]],
  ['bgBrightWhite', [107, 49]],
];

function _createColorMethod(name, codes) {
  const isReset = name === 'reset';

  return function method(str) {
    Dust.assert(
      str === undefined || typeof str === 'string',
      `The parameter str for Colors.${name} must be a string`,
    );

    if (isReset) this._styles.clear();
    else this._styles.add(codes);

    if (str !== undefined) {
      if (!isReset)
        for (const [opening, closing] of [...this._styles].reverse()) {
          str = `\x1b[${opening}m${str}\x1b[${closing}m`;
        }

      return str;
    }

    return this;
  };
}

for (const [name, codes] of _colors) {
  Dust.attachMethod(_Colors.prototype, name, _createColorMethod(name, codes));
}

function colors(str) {
  return new _Colors(str);
}

function isColors(value) {
  return value != null && !!value[_colorsSymbol];
}

module.exports = {
  colors,
  isColors,
};
