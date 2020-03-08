module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: ['plugin:import/recommended', 'airbnb-base', 'prettier'],
  parser: 'babel-eslint',
  plugins: ['babel'],
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
  },
  rules: {
    'prefer-destructuring': 'off',
    'no-use-before-define': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-new-wrappers': 'off',
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
    'no-dupe-class-members': 'off', // Allows methods overloading
    'no-console': 'off',
    'no-restricted-syntax': 'off', // Allows for ... of usage
    'no-await-in-loop': 'off',
    'max-len': [
      'error',
      100,
      2,
      {
        ignoreUrls: true,
        ignoreComments: true, // Allow JSDoc comments
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
  },
};
