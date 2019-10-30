import { Command, Addon, CommandMessage } from '../..';

export default class StatsCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'stats',
    });
  }

  protected async didDispatch(message: CommandMessage) {
    message.send(`Mem Usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
  }
}
