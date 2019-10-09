import Discord from 'discord.js';
import { Command, Client, Validator, ValidationResults } from '../..';

export default class ValidatorCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'v',
      schema: {
        num1: Validator.number().require(),
        num2: Validator.number()
          .integer()
          .compare('num1', 'greaterOrEqual')
          .require(),
      },
    });
  }

  async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for Validator');
  }

  async didDispatch(message: Discord.Message, { num1, num2 }: ValidationResults) {
    message.channel.send(`${num1} < ${num2} enit?`);
  }
}
