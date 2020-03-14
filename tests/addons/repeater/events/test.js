const Nebula = require('../../../../src');

module.exports = Nebula.event({
  name: 'message',

  run: (_, message) => {
    if (message.author.bot) return;

    message.channel.send('Message 1');
  },
});
