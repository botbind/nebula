import Discord from 'discord.js';
import Client from '../Client';
import Util from '../Util';
import Message from '../Message';

export default function createExtensions(client: Client) {
  Object.defineProperties(Discord.Message.prototype, {
    send: {
      async value(
        content: Discord.StringResolvable = '',
        options?: Discord.MessageOptions | Discord.RichEmbed | Discord.Attachment,
      ) {
        let actualContent = content;
        let actualOptions = options;

        if (!options && Util.isObject(content)) {
          actualContent = '';
          actualOptions = content;
        } else {
          actualOptions = {};
        }

        const that = this as Discord.Message;
        const responseCollection = client.arp.get(that.id)!;

        // If we couldn't find the response collection, meaning that the message doesn't have an
        // activator, send the message without collecting
        if (!responseCollection) {
          return this.channel.send(actualContent, actualOptions);
        }

        const [stop, responses] = responseCollection;

        if (stop) {
          responses
            .filter(response => !response.deleted)
            .forEach(response => {
              response.delete();
            });

          client.arp.set(that.id, [true, []]);
        }

        const message = (await that.channel.send(actualContent, actualOptions)) as Message;

        responses.push(message);

        return message;
      },
    },
  });
}
