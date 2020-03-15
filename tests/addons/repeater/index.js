const Discord = require('discord.js');
const Nebula = require('../../../src');

module.exports = Nebula.addon({
  name: 'repeater',
  baseDir: __dirname,

  initialize: addon => {
    addon.client.logger.success('Addon initialized!');

    addon.vars.report = description =>
      new Discord.MessageEmbed()
        .setColor('RED')
        .setTitle('Error')
        .setDescription(description);
  },

  error: (addon, code, ctx) => {
    if (code === 'addon.commandNotFound') {
      ctx.message.channel.send({
        embed: addon.vars.report('Command not found, please try again'),
      });

      return;
    }

    return Nebula.symbols.next;
  },
});
