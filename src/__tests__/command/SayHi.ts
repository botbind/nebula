import Discord from 'discord.js';
import { Command, Client, Validator } from '../..';

export default class SayHi extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'say-hi',
      alias: ['greet', 'hi'],
      schema: [
        Validator.string().require(),
        Validator.number()
          .integer()
          .range(0, 15)
          .require(),
      ],
    });
  }

  public didDispatch(message: Discord.Message, [name, age]: [string, number]) {
    message.channel.send(`Hi, ${name}, ${age} years old`);
  }
}
