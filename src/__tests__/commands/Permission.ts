import { Command, Addon, CommandMessage } from '../..';

export default class PermissionCommand extends Command {
  constructor(addon: Addon, name: string, group: string) {
    super(addon, name, group, {
      name: 'p',
      isGuildOnly: true,
      permLevel: 7,
    });
  }

  protected async willRun(message: CommandMessage) {
    message.send('Test suites for permissions');
  }

  protected async run(message: CommandMessage) {
    message.send('You are allowed to run this command');
  }
}
