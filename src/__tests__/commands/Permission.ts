import { Command, Addon, Message } from '../..';

export default class PermissionCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'p',
      permission: {
        level: 7,
      },
    });
  }

  public async willDispatch(message: Message) {
    message.send('Test suites for permissions');
  }

  public async didDispatch(message: Message) {
    message.send('You are allowed to run this command');
  }
}
