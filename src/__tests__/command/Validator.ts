import Discord from 'discord.js';
import { Command, Client, Validator } from '../..';
import { ValidationResultStore } from 'src/Validator';

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

  public async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for Validator');
  }

  public async didDispatch(message: Discord.Message, { num1, num2 }: ValidationResultStore) {
    await message.channel.send(`${num1} < ${num2} enit?`);
  }
}
