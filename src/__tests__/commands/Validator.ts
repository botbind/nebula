import { Command, Addon, Validator, ValidationResults } from '../..';

export default class ValidatorCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'v',
      schema: {
        mention: Validator.string().user(),
      },
    });
  }

  public async willDispatch() {
    this.send('Test suites for Validator');
  }

  public async didDispatch({ mention }: ValidationResults) {
    this.send(`Mention: ${mention}`);
  }
}
