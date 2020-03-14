import L from '@botbind/lyra';
import Addon from './Addon';
import Resource, { ResourceOptions } from './Resource';
import Util from './Util';
import Debugger from './Debugger';
import NebulaError from './NebulaError';
import * as Constants from './constants';

/**
 * The options for the event
 */
export interface EventOptions extends ResourceOptions {
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
  once: boolean;

  /**
   * The base structure for all Nebula events
   * @param addon The addon of the event
   * @param name The name of the event
   * @param group The group of the event
   * @param options The options for the event
   */
  constructor(options: EventOptions) {
    const result = L.object({})
      .label('Event options')
      .validate(options);

    super({ addon, filename, group });

    this.once = once;
  }

  /**
   * Invoke all the lifecycle methods
   * @param args The arguments of the event
   */
  invokeLifecycles(...args: unknown[]) {
    Debugger.info(`${this.constructor.name} run`, 'Lifecycle');

    this.run(...args);
  }

  /**
   * Invoked when the event runs
   * @param args The arguments of the event
   */
  abstract run(...args: unknown[]): Promise<void>;
}
