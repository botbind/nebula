import Discord from 'discord.js';
import Addon from './Addon';
import Resource from './Resource';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';
import * as Constants from './constants';

/**
 * The options for the monitor
 */
export interface MonitorOptions {
  /**
   * The name of the monitor
   */
  name?: string;

  /**
   * Whether the monitor should ignore other bots
   */
  shouldIgnoreBots?: boolean;

  /**
   * Whether the monitor should ignore itself
   */
  shouldIgnoreSelf?: boolean;

  /**
   * Whether the monitor should ignore webhooks. Setting to false doesn't have any effects if ignoreBots is set to true
   */
  shouldIgnoreWebhooks?: boolean;
}

export default abstract class Monitor extends Resource {
  /**
   * Whether the monitor should ignore other bots
   */
  public shouldIgnoreBots: boolean;

  /**
   * Whether the monitor should ignore itself
   */
  public shouldIgnoreSelf: boolean;

  /**
   * Whether the monitor should ignore webhooks. Setting to false doesn't have any effects if ignoreBots is set to true
   */
  public shouldIgnoreWebhooks: boolean;

  /**
   * The base structure for all Nebula monitors
   * @param addon The addon of the monitor
   * @param name The name of the monitor
   * @param group The group of the monitor
   * @param options The options for the monitor
   */
  constructor(addon: Addon, name: string, group: string, options: MonitorOptions = {}) {
    if (Constants.IS_DEV && !Util.isObject(options))
      throw new NebulaError(Constants.ERROR_MESSAGES['monitor.options']);

    const {
      name: nameFromOptions = '',
      shouldIgnoreBots = true,
      shouldIgnoreSelf = true,
      shouldIgnoreWebhooks = true,
    } = options;

    if (Constants.IS_DEV) {
      if (typeof nameFromOptions !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['monitor.options.name']);

      if (typeof shouldIgnoreBots !== 'boolean')
        throw new NebulaError(
          Constants.ERROR_MESSAGES['monitor.options.shouldIgnoreBots'],
        );

      if (typeof shouldIgnoreSelf !== 'boolean')
        throw new NebulaError(
          Constants.ERROR_MESSAGES['monitor.options.shouldIgnoreSelf'],
        );

      if (typeof shouldIgnoreWebhooks !== 'boolean')
        throw new NebulaError(
          Constants.ERROR_MESSAGES['monitor.options.shouldIgnoreWebhooks'],
        );
    }

    super(addon, nameFromOptions == null ? name : nameFromOptions, group);

    this.shouldIgnoreBots = shouldIgnoreBots;
    this.shouldIgnoreSelf = shouldIgnoreSelf;
    this.shouldIgnoreWebhooks = shouldIgnoreWebhooks;
  }

  /**
   * Invoke all the lifecycle methods
   * @param message The created message
   */
  public async invokeLifecycles(message: Discord.Message) {
    const constructorName = this.constructor.name;

    Debugger.info(`${constructorName} shouldRun`, 'Lifecycle');

    const shouldRun = await this.shouldRun(message);

    Debugger.info(`${constructorName} run`, 'Lifecycle');

    if (shouldRun) this.run(message);
  }

  /**
   * Whether the monitor should run
   * @param message The created message
   */
  protected async shouldRun(message: Discord.Message) {
    return (
      (!this.shouldIgnoreBots || !message.author.bot) &&
      (!this.shouldIgnoreSelf || message.author !== this.addon.client.user) &&
      (!this.shouldIgnoreWebhooks || message.webhookID == null)
    );
  }

  /**
   * Invoked when the monitor runs
   * @param message The created message
   */
  protected abstract async run(message: Discord.Message): Promise<void>;
}
