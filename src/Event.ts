import merge from 'lodash.merge';
import Addon from './Addon';
import Resource from './Resource';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';
import { RequiredExcept } from './types';

/**
 * The optional options passed as arguments to the event
 */
export interface OptionalEventOptions {
  /**
   * The name of the event
   */
  name?: string;

  /**
   * Whether the event should only be ran once then unloaded
   */
  once?: boolean;
}

/**
 * The options for the event
 */
export type EventOptions = RequiredExcept<OptionalEventOptions, 'name'>;

const defaultOptions: EventOptions = {
  once: false,
};

export default abstract class Event extends Resource {
  /**
   * The options for the event
   */
  public options: EventOptions;

  /**
   * The base structure for all Nebula events
   * @param addon The addon of the event
   * @param options The options for the event
   */
  constructor(addon: Addon, name: string, group: string, options: OptionalEventOptions) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the event must be an object');

    super(addon, options.name == null ? name : options.name, group);

    const mergedOptions = merge({}, defaultOptions, options);

    this.options = mergedOptions;
  }

  /**
   * Trigger all the lifecycle methods
   * @param args The arguments of the event
   */
  public triggerLifecycles(...args: unknown[]) {
    Debugger.info(`${this.constructor.name} run`, 'Lifecycle');

    this.run(...args);
  }

  /**
   * Invoked when the event runs
   * @param args The arguments of the event
   */
  protected abstract run(...args: unknown[]): Promise<void>;
}
