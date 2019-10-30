import { Command, Addon, CommandMessage } from '../..';

export default class PermissionCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'p',
      permission: {
        level: 7,
      },
    });
  }

  protected async willDispatch(message: CommandMessage) {
    message.send('Test suites for permissions');
  }

  protected async didDispatch(message: CommandMessage) {
    message.send('You are allowed to run this command');
  }
}
