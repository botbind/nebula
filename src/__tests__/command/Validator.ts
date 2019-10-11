import Discord from 'discord.js';
import { Command, Client, Validator, ValidationResults } from '../..';

export default class ValidatorCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'v',
      schema: {
        mention: Validator.string().user(),
      },
    });
  }

  async willDispatch(message: Discord.Message) {
    message.channel.send('Test suites for Validator');
  }

  async didDispatch(message: Discord.Message, { mention }: ValidationResults) {
    message.channel.send(`Mention: ${mention}`);
  }
}
