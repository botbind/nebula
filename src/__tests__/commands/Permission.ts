import { Command, Addon } from '../..';

export default class PermissionCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'p',
      permission: {
        level: 7,
      },
    });
  }

  public async willDispatch() {
    this.send('Test suites for permissions');
  }

  public async didDispatch() {
    this.send('You are allowed to run this command');
  }
}
