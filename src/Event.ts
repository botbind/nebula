import merge from 'lodash.merge';
import Addon from './Addon';
import Resource from './Resource';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';

/**
 * The optional options passed as arguments to the event
 */
export interface OptionalEventOptions {
  /**
   * The name of the event
   */
  name: string;

  /**
   * Whether the event should only be ran once then unloaded
   */
  once?: boolean;
}

/**
 * The options for the event
 */
export type EventOptions = Required<OptionalEventOptions>;

const defaultOptions: EventOptions = {
  name: '',
  once: false,
};

export default abstract class Event extends Resource {
  /**
   * The options for the event
   */
  public options: EventOptions;

  /**
   * The name of the event
   */
  public name: string;

  /**
   * The base structure for all Nebula events
   * @param addon The addon of the event
   * @param options The options for the event
   */
  constructor(addon: Addon, options: OptionalEventOptions) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the event must be an object');

    if (options.name == null) throw new NebulaError('The name for the event must be specified');

    const mergedOptions = merge({}, defaultOptions, options);

    super(addon);

    const { name } = mergedOptions;

    this.name = name;
    this.options = mergedOptions;
  }

  /**
   * Call all the lifecycle methods
   * @param args The arguments of the event
   */
  public callLifecycles(...args: unknown[]) {
    Debugger.info(`${this.constructor.name} didDispatch`, 'Lifecycle');

    this.didDispatch(...args);
  }

  /**
   * Invoked when the event is dispatched
   * @param args The arguments of the event
   */
  protected abstract didDispatch(...args: unknown[]): Promise<void>;
}
