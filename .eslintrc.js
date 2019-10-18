module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts'],
      },
    },
  },
  rules: {
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
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
    ], // Prettier overrides max-len to off
    '@typescript-eslint/explicit-function-return-type': 'off', // Conflicts with airbnb's no-useless-call
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
