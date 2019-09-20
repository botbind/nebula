const config = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  ignore: ['node_modules'],
};

if (process.env.NODE_ENV === 'production') config.ignore.push('__tests__');

module.exports = config;
