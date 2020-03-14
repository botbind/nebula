require('dotenv/config');
const Nebula = require('../src');
const Repeater = require('./addons/repeater');

const client = Nebula.client({
  lang: 'vi-VN',
});

client.inject(Repeater);

client.on('nebulaReady', () => {
  client.logger.success('Client ready!');
});

client.login(process.env.NODE_ENV.DISCORD_TOKEN);

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});
