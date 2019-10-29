import { Command, Addon, Validator, ValidationResults, CommandMessage } from '../..';

export default class ValidatorCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'v',
      schema: {
        mention: Validator.string().user(),
      },
    });
  }

  public async willDispatch(message: CommandMessage) {
    message.send('Test suites for Validator');
  }

  public async didDispatch(message: CommandMessage, { mention }: ValidationResults) {
    message.send(`Mention: ${mention}`);
  }
}
