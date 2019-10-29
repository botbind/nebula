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

  public async willDispatch(message: CommandMessage) {
    message.send('Test suites for permissions');
  }

  public async didDispatch(message: CommandMessage) {
    message.send('You are allowed to run this command');
  }
}
