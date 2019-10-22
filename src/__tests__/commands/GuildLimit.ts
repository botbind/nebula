import { Command, Addon } from '../..';

export default class GuildLimitCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'g',
      limit: {
        time: 5000,
        scope: 'guild',
      },
    });
  }

  public async willDispatch() {
    this.send('Test suites for guild limit');
  }

  public async didDispatch() {
    const message = this.message!;

    this.send(
      `You have ${this.options.limit.bucket -
        this.usage.get(message.guild.id)![0]} time(s) left before cooling down. Scope: Guild`,
    );
  }
}
