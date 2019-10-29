import { Command, Addon, CommandMessage } from '../..';

export default class UserLimitCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'u',
      limit: {
        time: 5000,
      },
    });
  }

  public async willDispatch(message: CommandMessage) {
    message.send('Test suites for user limit');
  }

  public async didDispatch(message: CommandMessage) {
    message.send(
      `You have ${this.options.limit.bucket -
        this.usage.get(message.author.id)![0]} time(s) left before cooling down. Scope: User`,
    );
  }
}
