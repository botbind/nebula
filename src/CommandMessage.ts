import Discord from 'discord.js';
import Util from './Util';

type SendOptions = Discord.MessageOptions | Discord.Attachment | Discord.RichEmbed;
type CollectionFilter = (...args: unknown[]) => boolean;

export default class CommandMesage {
  /**
   * The activator of the message
   */
  public message: Discord.Message;

  private _responses: Discord.Message[];

  private _responseIndex: number;

  /**
   * The Nebula's wrapper class to cache the responses to a command
   * @param message The created message
   */
  constructor(message: Discord.Message) {
    this.message = message;
    this._responses = [];
    this._responseIndex = 0;
  }

  /**
   * Clean up unncessary responses
   */
  public reset() {
    if (this._responseIndex < this._responses.length) this._responses.pop()!.delete();

    this._responseIndex = 0;
  }

  /**
   * Send a message
   * @param content The content of the message
   * @param options The options for the message
   */
  public async send(content: string, options?: SendOptions): Promise<Discord.Message>;

  /**
   * Send a message
   * @param options The options for the message
   */
  public async send(options: SendOptions): Promise<Discord.Message>;

  public async send(content: string | SendOptions, options: SendOptions = {}) {
    let actualContent = content;
    let actualOptions = options;

    if (!options && Util.isObject(content)) {
      actualContent = '';
      actualOptions = content as SendOptions;
    } else {
      actualOptions = {};
    }

    const currentResponse = this._responses[this._responseIndex];

    this._responseIndex += 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (currentResponse != null && !(currentResponse as any).deleted) {
      return currentResponse.edit(actualContent, actualOptions as
        | Discord.RichEmbed
        | Discord.MessageEditOptions);
    }

    const message = (await this.message.channel.send(
      actualContent,
      actualOptions,
    )) as Discord.Message;

    this._responses.push(message);

    return message;
  }

  // Shortcuts
  // Please do not touch whatever is down here, otherwise you're not getting gifts from Santa Claus

  // Getters/Setters

  /**
   * A collection of attachments in the message - e.g. Pictures - mapped by their ID
   */
  get attachments() {
    return this.message.attachments;
  }

  set attachments(attachments) {
    this.message.attachments = attachments;
  }

  /**
   * The author of the message
   */
  get author() {
    return this.message.author;
  }

  set author(author) {
    this.message.author = author;
  }

  /**
   * The channel that the message was sent in
   */
  get channel() {
    return this.message.channel;
  }

  set channel(channel) {
    this.message.channel = channel;
  }

  /**
   * The message contents with all mentions replaced by the equivalent text. If mentions cannot be resolved to a name, the relevant mention in the message content will not be converted.
   */
  get cleanContent() {
    return this.message.cleanContent;
  }

  /**
   * The client that instantiated the Message
   */
  get client() {
    return this.message.client;
  }

  /**
   * The content of the messge
   */
  get content() {
    return this.message.content;
  }

  set content(content) {
    this.message.content = content;
  }

  /**
   * The time the message was sent
   */
  get createdAt() {
    return this.message.createdAt;
  }

  /**
   * The timestamp the message was sent at
   */
  get createdTimestamp() {
    return this.message.createdTimestamp;
  }

  set createdTimestamp(createdTimestamp) {
    this.message.createdTimestamp = createdTimestamp;
  }

  /**
   * Whether the message is deletable by the client user
   */
  get deletable() {
    return this.message.deletable;
  }

  /**
   * Whether this message has been deleted
   */
  get deleted() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.message as any).deleted;
  }

  set deleted(deleted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.message as any).deleted = deleted;
  }

  /**
   * Whether the message is editable by the client user
   */
  get editable() {
    return this.message.editable;
  }

  /**
   * The time the message was last edited at (if applicable)
   */
  get editedAt() {
    return this.message.editedAt;
  }

  /**
   * The timestamp the message was last edited at (if applicable)
   */
  get editedTimestamp() {
    return this.message.editedTimestamp;
  }

  set editedTimestamp(editedTimestamp) {
    this.message.editedTimestamp = editedTimestamp;
  }

  /**
   * An array of cached versions of the message, including the current version sorted from latest (first) to oldest (last)
   */
  get edits() {
    return this.message.edits;
  }

  /**
   * A list of embeds in the message - e.g. YouTube Player
   */
  get embeds() {
    return this.message.embeds;
  }

  set embeds(embeds) {
    this.message.embeds = embeds;
  }

  /**
   * The guild the message was sent in (if in a guild channel)
   */
  get guild() {
    return this.message.guild;
  }

  /**
   * Whether this message is a hit in a search
   */
  get hit() {
    return this.message.hit;
  }

  set hit(hit) {
    this.message.hit = hit;
  }

  /**
   * The ID of the message
   */
  get id() {
    return this.message.id;
  }

  set id(id) {
    this.message.id = id;
  }

  /**
   * Represents the author of the message as a guild member Only available if the message comes from a guild where the author is still a member
   */
  get member() {
    return this.message.member;
  }

  set member(member) {
    this.message.member = member;
  }

  /**
   * All valid mentions that the message contains
   */
  get mentions() {
    return this.message.mentions;
  }

  set mentions(mentions) {
    this.message.mentions = mentions;
  }

  /**
   * A random number or string used for checking message delivery
   */
  get nonce() {
    return this.message.nonce;
  }

  set nonce(nonce) {
    this.message.nonce = nonce;
  }

  /**
   * Whether the message is pinnable by the client user
   */
  get pinnable() {
    return this.message.pinnable;
  }

  /**
   * Whether or not this message is pinned
   */
  get pinned() {
    return this.message.pinned;
  }

  set pinned(pinned) {
    this.message.pinned = pinned;
  }

  /**
   * A collection of reactions to this message, mapped by the reaction ID
   */
  get reactions() {
    return this.message.reactions;
  }

  set reactions(reactions) {
    this.message.reactions = reactions;
  }

  /**
   * Whether or not this message was sent by Discord, not actually a user (e.g. pin notifications)
   */
  get system() {
    return this.message.system;
  }

  set system(system) {
    this.message.system = system;
  }

  /**
   * Whether or not the message was Text-To-Speech
   */
  get tts() {
    return this.message.tts;
  }

  set tts(tts) {
    this.message.tts = tts;
  }

  /**
   * The type of the message
   */
  get type() {
    return this.message.type;
  }

  set type(type) {
    this.message.type = type;
  }

  /**
   * The url to jump to the message
   */
  get url() {
    return this.message.url;
  }

  /**
   * ID of the webhook that sent the message, if applicable
   */
  get webhookID() {
    return this.message.webhookID;
  }

  set webhookID(webhookID) {
    this.message.webhookID = webhookID;
  }

  // Methods

  /**
   * Marks the message as read.
   */
  public acknowledge() {
    return this.message.acknowledge();
  }

  /**
   * Similar to createMessageCollector but in promise form. Resolves with a collection of reactions that pass the specified filter.
   * @param filter The filter function to use
   * @param options Optional options to pass to the internal collector
   */
  public awaitReactions(filter: CollectionFilter, options?: Discord.AwaitReactionsOptions) {
    return this.message.awaitReactions(filter, options);
  }

  /**
   * Remove all reactions from a message.
   */
  public clearReactions() {
    return this.message.clearReactions();
  }

  /**
   * Creates a reaction collector.
   * @param filter The filter to apply
   * @param options Options to send to the collector
   */
  public createReactionCollector(
    filter: CollectionFilter,
    options?: Discord.ReactionCollectorOptions,
  ) {
    return this.message.createReactionCollector(filter, options);
  }

  /**
   * Deletes the message
   * @param timeout How long to wait to delete the message in milliseconds
   */
  public delete(timeout?: number) {
    return this.message.delete(timeout);
  }

  /**
   * Edit the content of the message
   * @param content The new content for the message
   * @param options The options to provide
   */
  public edit(
    content: Discord.StringResolvable,
    options: Discord.MessageEditOptions | Discord.RichEmbed,
  ) {
    return this.message.edit(content, options);
  }

  /**
   * Edit the content of the message, with a code block.
   * @param lang The language for the code block
   * @param content The new content for the message
   */
  public editCode(lang: string, content: Discord.StringResolvable) {
    return this.message.editCode(lang, content);
  }

  /**
   * Used mainly internally. Whether two messages are identical in properties. If you want to compare messages without checking all the properties, use message.id === message2.id, which is much more efficient. This method allows you to see if there are differences in content, embeds, attachments, nonce and tts properties.
   * @param message The message to compare it to
   * @param rawData Raw data passed through the WebSocket about this message
   */
  public equals(message: Discord.Message, rawData: object) {
    return this.message.equals(message, rawData);
  }

  /**
   * Fetches the webhook used to create this message.
   */
  public fetchWebhook() {
    return this.message.fetchWebhook();
  }

  /**
   * Whether or not a guild member is mentioned in this message. Takes into account user mentions, role mentions, and @everyone/@here mentions.
   * @param member The member/user to check for a mention of
   */
  public isMemberMentioned(member: Discord.GuildMember | Discord.User) {
    return this.message.isMemberMentioned(member);
  }

  /**
   * Whether or not a user, channel or role is mentioned in this message.
   * @param data Either a guild channel, user or a role object, or a string representing the ID of any of these
   */
  public isMentioned(data: Discord.GuildChannel | Discord.User | Discord.Role | string) {
    return this.message.isMentioned(data);
  }

  /**
   * Pins this message to the channel's pinned messages.
   */
  public pin() {
    return this.message.pin();
  }

  /**
   * Add a reaction to the message.
   * @param emoji The emoji to react with
   */
  public react(emoji: Discord.Emoji | Discord.ReactionEmoji | string) {
    return this.message.react(emoji);
  }

  /**
   * Reply to the message.
   * @param content The content for the message
   * @param options The options to provide
   */
  public reply(content: Discord.StringResolvable, options: Discord.MessageOptions) {
    let actualContent = content;
    let actualOptions = options;

    if (!options && Util.isObject(content)) {
      actualContent = '';
      actualOptions = content as Discord.MessageOptions;
    } else {
      actualOptions = {};
    }

    return this.send(actualContent, {
      ...actualOptions,
      reply: this.message.member || this.message.author,
    });
  }

  /**
   * When concatenated with a string, this automatically concatenates the message's content instead of the object.
   */
  public toString() {
    return this.message.toString();
  }

  /**
   * Unpins this message from the channel's pinned messages.
   */
  public unpin() {
    return this.message.unpin();
  }
}
