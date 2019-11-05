import { Command, Addon, CommandMessage } from '../..';

export default class UserLimitCommand extends Command {
  constructor(addon: Addon, name: string, group: string) {
    super(addon, name, group, {
      name: 'u',
      limit: {
        time: 5000,
      },
    });
  }

  protected async willRun(message: CommandMessage) {
    message.send('Test suites for user limit');
  }

  protected async run(message: CommandMessage) {
    message.send(
      `You have ${this.options.limit.bucket -
        this.usage.get(message.author.id)![0]} time(s) left before cooling down. Scope: User`,
    );
  }
}
