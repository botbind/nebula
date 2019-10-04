module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: ['plugin:import/recommended', 'airbnb-base', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
  },
  plugins: ['babel'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'linebreak-style': 'off',

    'no-underscore-dangle': 'off',
    'no-console': 'off',
    'no-alert': 'error',
    'no-constant-condition': 'error',

    'class-methods-use-this': 'off',
    'no-restricted-syntax': 'off',
    'no-param-reassign': 'off',
    'no-prototype-builtins': 'off',

    'prefer-destructuring': 'off',
    'consistent-this': ['error', 'self'],
    'max-len': [
      'error',
      100,
      2,
      {
        ignoreUrls: true,
      },
    ],
    'import/no-extraneous-dependencies': 'off',
    'import/namespace': ['error', { allowComputed: true }],
    'import/order': [
      'error',
      {
        groups: [['index', 'sibling', 'parent', 'internal', 'external', 'builtin']],
        'newlines-between': 'never',
      },
    ],
  },
};
