import Discord from 'discord.js';
import { Command, Client, Validator } from '../..';

export default class TestCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'test',
      alias: ['t'],
      schema: [
        Validator.boolean()
          .truthy()
          .require(),
        Validator.boolean()
          .falsy()
          .require(),
      ],
    });
  }

  public didDispatch(message: Discord.Message) {
    message.channel.send('Hi, it works!');
  }
}
