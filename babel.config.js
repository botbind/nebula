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

if (process.env.NODE_ENV !== 'development') config.ignore.push('src/__tests__');

module.exports = config;
