import { Command, Addon, Validator, ValidationResults, CommandMessage } from '../..';

export default class ValidatorCommand extends Command {
  constructor(addon: Addon, name: string, group: string) {
    super(addon, name, group, {
      name: 'v',
      schema: {
        mention: Validator.string().user(),
      },
    });
  }

  protected async willRun(message: CommandMessage) {
    message.send('Test suites for Validator');
  }

  protected async run(message: CommandMessage, { mention }: ValidationResults) {
    message.send(`Mention: ${mention}`);
  }
}
