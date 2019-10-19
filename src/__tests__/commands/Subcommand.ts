import { Command, Addon, Validator, ValidationResults, Message } from '../..';

class Child3 extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'child-3',
      isSubcommand: true,
      schema: {
        num: Validator.number(),
      },
    });
  }

  public async didDispatch(message: Message, { num }: ValidationResults) {
    message.send(`This comes from child3. I accept arguments! ${num}`);
  }
}

class Child1 extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'child-1',
      isSubcommand: true,
      subcommands: {
        commands: [Child3],
      },
    });
  }

  public async didDispatch(message: Message) {
    message.send('This comes from child1');
  }
}

class Child2 extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'child-2',
      isSubcommand: true,
    });
  }

  public async didDispatch(message: Message) {
    message.send('This comes from child2');
  }
}

export default class SubcommandCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 's',
      subcommands: {
        commands: [Child1, Child2],
      },
    });
  }
}
