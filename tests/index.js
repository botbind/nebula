const Nebula = require('../src');
const Repeater = require('./addons/repeater');

const client = Nebula.client({
  lang: 'vi-VN',
});

client.inject(Repeater);

client.on('nebulaReady', () => {
  client.logger.success('Client ready!');
});

client.login('Njg1OTMxNjgxOTk5MjI0ODU2.XmqfOw.GtWbPFWe29vUCZV4cajBTF2mmwg');

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});
