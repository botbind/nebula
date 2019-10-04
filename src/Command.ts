import Discord from 'discord.js';
import merge from 'lodash.merge';
import Util from './Util';
import { Schema, ValidationResultStore } from './Validator';
import ValidationError from './Validator/ValidationError';

export interface CommandOptions {
  /**
   * The name of the command
   */
  name: string;
  /**
   * The alias of the command
   */
  alias?: string[];
  /**
   * The validation schema of the command
   */
  schema?: Schema;
}

const defaultOptions = {
  alias: [],
};

export default abstract class Command {
  /**
   * The client of the command
   */
  private client: Discord.Client;
  /**
   * The name of the command
   */
  readonly name: string;
  /**
   * The options of the command
   */
  readonly options: Omit<CommandOptions & typeof defaultOptions, 'name'>;

  /**
   * Invoked when the command becomes ready to start working
   */
  didReady?(): void;

  /**
   * Invoked before the command is dispatched. Return false to inhibit the command
   * @param message - The created message
   */
  willDispatch?(message: Discord.Message): Promise<void | boolean>;

  /**
   * Invoked when the command is successfully dispatched
   * @param message - The created message
   */
  didSuccessfulDispatch?(message: Discord.Message): Promise<void>;

  /**
   * Invoked when the command fails
   * @param message - The created message
   */
  didFailedDispatch?(message: Discord.Message): Promise<void>;

  /**
   * The base class for all Nebula commands
   * @param client - The client of the command
   * @param options - The options of the command
   */
  constructor(client: Discord.Client, options: CommandOptions) {
    if (!Util.isObject(options)) throw new TypeError('commandOptions must be an object');

    const { name, ...rest } = merge({}, defaultOptions, options);

    this.client = client;
    this.name = name;
    this.options = rest;
  }

  /**
   * Invoked when the command is dispatched
   * @param message - The created message
   * @param args - The user arguments
   */
  abstract didDispatch(
    message: Discord.Message,
    args?: ValidationResultStore,
  ): Promise<void | boolean>;

  /**
   * Invoked when the user arguments don't meet the validation schema
   * @param message - The created message
   * @param results - The validation results
   */
  didCatchValidationErrors(message: Discord.Message, results: ValidationResultStore) {
    Object.values(results).forEach(errs => {
      if (errs !== null && Util.isArray(errs))
        (errs as ValidationError[]).forEach(err => {
          message.channel.send(err.message);
        });
    });
  }
}
