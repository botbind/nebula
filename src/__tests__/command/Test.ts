import Discord from 'discord.js';
import { Command, Client, Validator, ValidationError } from '../..';

export default class TestCommand extends Command {
  constructor(client: Client) {
    const validator = new Validator();

    super(client, {
      name: 'test',
      alias: ['t'],
      schema: [Validator.any, Validator.range(5, 10)],
    });
  }

  public async didDispatch(message: Discord.Message) {
    message.channel.send('Hi, it works!');
  }

  public didCatchValidationError(message: Discord.Message, errs: ValidationError[]) {
    if (errs[0].type === 'range') {
      message.channel.send('Oops, seems like your second argument is not between 5 and 10');
    }
  }
}
