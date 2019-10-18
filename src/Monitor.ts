import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Util from './Util';
import NebulaError from './NebulaError';

/**
 * The optional options passed as arguments to the monitor
 */
export interface OptionalMonitorOptions {
  /**
   * Whether the monitor should ignore other bots
   */
  ignoreBots?: boolean;

  /**
   * Whether the monitor should ignore itself
   */
  ignoreSelf?: boolean;

  /**
   * Whether the monitor should ignore webhooks. Setting to false doesn't have any effects if ignoreBots is set to true
   */
  ignoreWebhooks?: boolean;
}

/**
 * The options for the monitor
 */
export type MonitorOptions = Required<OptionalMonitorOptions>;

const defaultOptions: MonitorOptions = {
  ignoreBots: true,
  ignoreSelf: true,
  ignoreWebhooks: true,
};

export default abstract class Monitor {
  /**
   * The addon of the monitor
   */
  protected addon: Addon;

  /**
   * The options for the monitor
   */
  public options: MonitorOptions;

  /**
   * Invoked when the monitor becomes ready to start working
   */
  public async didReady?(): Promise<void>;

  /**
   * Whether the monitor should be dispatched
   * @param message The created message
   */
  public async shouldDispatch(message: Discord.Message) {
    return (
      (!this.options.ignoreBots || !message.author.bot) &&
      (!this.options.ignoreSelf || message.author.id !== this.addon.client.user.id) &&
      (!this.options.ignoreWebhooks || message.webhookID == null)
    );
  }

  /**
   * Invoked when the monitor is dispatched
   * @param message The created message
   */
  public abstract async didDispatch(message: Discord.Message): Promise<void>;

  /**
   * The base structure for all Nebula monitors
   * @param addon The addon of the monitor
   * @param options The options for the monitor
   */
  constructor(addon: Addon, options: OptionalMonitorOptions = {}) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the monitor must be an object!');

    this.addon = addon;
    this.options = merge({}, defaultOptions, options);
  }
}
