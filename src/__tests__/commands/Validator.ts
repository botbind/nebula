import { Command, Addon, Validator, ValidationResults, Message } from '../..';

export default class ValidatorCommand extends Command {
  constructor(addon: Addon) {
    super(addon, {
      name: 'v',
      schema: {
        mention: Validator.string().user(),
      },
    });
  }

  public async willDispatch(message: Message) {
    message.send('Test suites for Validator');
  }

  public async didDispatch(message: Message, { mention }: ValidationResults) {
    message.send(`Mention: ${mention}`);
  }
}
