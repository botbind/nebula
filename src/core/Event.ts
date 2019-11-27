import Addon from './Addon';
import Resource from './Resource';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';
import * as Constants from './constants';

/**
 * The options for the event
 */
export interface EventOptions {
  /**
   * The name of the event
   */
  name?: string;

  /**
   * Whether the event should only be ran once then unloaded
   */
  once?: boolean;
}

export default abstract class Event extends Resource {
  /**
   * Whether the event should only be ran once then unloaded
   */
  public once: boolean;

  /**
   * The base structure for all Nebula events
   * @param addon The addon of the event
   * @param name The name of the event
   * @param group The group of the event
   * @param options The options for the event
   */
  constructor(addon: Addon, name: string, group: string, options: EventOptions = {}) {
    if (Constants.IS_DEV && !Util.isObject(options))
      throw new NebulaError(Constants.ERROR_MESSAGES['event.options']);

    const { name: nameFromOptions = '', once = false } = options;

    if (Constants.IS_DEV) {
      if (typeof nameFromOptions !== 'string')
        throw new NebulaError(Constants.ERROR_MESSAGES['event.options.name']);

      if (typeof once !== 'boolean')
        throw new NebulaError(Constants.ERROR_MESSAGES['event.options.once']);
    }

    super(addon, nameFromOptions == null ? name : nameFromOptions, group);

    this.once = once;
  }

  /**
   * Invoke all the lifecycle methods
   * @param args The arguments of the event
   */
  public invokeLifecycles(...args: unknown[]) {
    Debugger.info(`${this.constructor.name} run`, 'Lifecycle');

    this.run(...args);
  }

  /**
   * Invoked when the event runs
   * @param args The arguments of the event
   */
  protected abstract run(...args: unknown[]): Promise<void>;
}
