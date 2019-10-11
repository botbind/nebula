import Discord from 'discord.js';
import { Command, Client, Validator, ValidationResults } from '../..';

class Child3 extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'child-3',
      isSubcommand: true,
      schema: {
        num: Validator.number(),
      },
    });
  }

  async didDispatch(message: Discord.Message, { num }: ValidationResults) {
    message.channel.send(`This comes from child3. I accept arguments! ${num}`);
  }
}

class Child1 extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'child-1',
      isSubcommand: true,
      subcommands: {
        commands: [Child3],
      },
    });
  }

  async didDispatch(message: Discord.Message) {
    message.channel.send('This comes from child1');
  }
}

class Child2 extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'child-2',
      isSubcommand: true,
    });
  }

  async didDispatch(message: Discord.Message) {
    message.channel.send('This comes from child2');
  }
}

export default class SubcommandCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 's',
      subcommands: {
        commands: [Child1, Child2],
      },
    });
  }
}
