import Discord from 'discord.js';

export default interface Message extends Discord.Message {
  // Looks like Discordjs doesn't have typing for this property
  /**
   * Whether the message is deleted
   */
  deleted?: boolean;

  /**
   * Send a message to the channel the initial message is in
   * @param content The text of the message
   * @param options The options for the message, can also be just a RichEmbed or Attachment
   */
  send(
    content?: Discord.StringResolvable,
    options?: Discord.MessageOptions | Discord.RichEmbed | Discord.Attachment,
  ): Promise<Message>;

  /**
   * Send a message to the channel the initial message is in
   * @param options The options for the message, can also be just a RichEmbed or Attachment
   */
  send(options?: Discord.MessageOptions | Discord.RichEmbed | Discord.Attachment): Promise<Message>;
}
