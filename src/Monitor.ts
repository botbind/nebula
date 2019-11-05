import Discord from 'discord.js';
import merge from 'lodash.merge';
import Addon from './Addon';
import Resource from './Resource';
import Util from './Util';
import Debugger from './Debugger';
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

export default abstract class Monitor extends Resource {
  /**
   * The options for the monitor
   */
  public options: MonitorOptions;

  /**
   * The base structure for all Nebula monitors
   * @param addon The addon of the monitor
   * @param options The options for the monitor
   */
  constructor(addon: Addon, name: string, group: string, options: OptionalMonitorOptions = {}) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the monitor must be an object!');

    super(addon, name, group);

    this.options = merge({}, defaultOptions, options);
  }

  /**
   * Trigger all the lifecycle methods
   * @param message The created message
   */
  public async triggerLifecycles(message: Discord.Message) {
    const constructorName = this.constructor.name;

    Debugger.info(`${constructorName} shouldRun`, 'Lifecycle');

    const shouldDispatch = await this.shouldRun(message);

    Debugger.info(`${constructorName} run`, 'Lifecycle');

    if (shouldDispatch) this.run(message);
  }

  /**
   * Whether the monitor should run
   * @param message The created message
   */
  protected async shouldRun(message: Discord.Message) {
    return (
      (!this.options.ignoreBots || !message.author.bot) &&
      (!this.options.ignoreSelf || message.author !== this.addon.client.user) &&
      (!this.options.ignoreWebhooks || message.webhookID == null)
    );
  }

  /**
   * Invoked when the monitor runs
   * @param message The created message
   */
  protected abstract async run(message: Discord.Message): Promise<void>;
}
