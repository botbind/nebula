const Nebula = require('../src');
const Repeater = require('./addons/repeater');

const client = Nebula.client();

client.inject(Repeater);

client.on('nebulaReady', () => {
  client.logger.log('ready!');
});

client.login('Njg1OTMxNjgxOTk5MjI0ODU2.XmP1ww.99kJ8-KzvckFc5xECfGNrLL8nlk');
