import { Command, Addon, CommandMessage } from '../..';

export default class StatsCommand extends Command {
  constructor(addon: Addon, name: string, group: string) {
    super(addon, name, group, {
      name: 'stats',
    });
  }

  protected async run(message: CommandMessage) {
    message.send(`Mem Usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
  }
}
