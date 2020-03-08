const Nebula = require('../../../../src');

module.exports = Nebula.command({
  name: 'test',
  alias: ['test2'],
  dispatch(message) {
    message.channel.send('test');
  },
});
