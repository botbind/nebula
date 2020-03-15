const L = require('@botbind/lyra');
const Nebula = require('../../../../src');

const bold = Nebula.command({
  name: 'bold',
  args: L.string
    .max(20)
    .label('message')
    .required(),

  run: (_, message, args) => {
    message.channel.send(`**${args}**`);
  },
});

const italic = Nebula.command({
  name: 'italic',
  args: L.string
    .max(10)
    .label('message')
    .required(),

  initialize: command => {
    command.vars._count = 0;
  },

  run: (command, message, args) => {
    command.vars._count++;

    if (command.vars._count === 3) {
      command.cooldowns.add(message, 5000, 'user');
      command.vars._count = 0;
    }

    message.channel.send(
      command.addon.lang.render('said', { author: message.author.username, content: `*${args}*` }),
    );
  },
});

module.exports = Nebula.command({
  name: 'repeat',
  description: 'Repeat what you said!',
  alias: ['say', 'speak'],
  subcommands: [bold, italic],

  error: (command, code, ctx) => {
    if (code === 'command.args') {
      ctx.message.channel.send({
        embed: command.addon.vars.report(ctx.err.message),
      });

      return;
    }

    return Nebula.symbols.next;
  },
});
