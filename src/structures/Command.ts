import Discord from 'discord.js';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
import ValidationError from './ValidationError';
import { CommandOptions } from '../types';

const defaultOptions = {
  alias: [],
};

export default abstract class Command {
  private client: Discord.Client;
  public readonly name: string;
  public readonly options: Omit<CommandOptions & typeof defaultOptions, 'name'>;

  constructor(client: Discord.Client, options: CommandOptions) {
    if (!isPlainObject(options)) throw new TypeError('commandOptions must be an object');

    const { name, ...rest } = merge(defaultOptions, options);

    this.client = client;
    this.name = name;
    this.options = rest;
  }

  public abstract didDispatch(message: Discord.Message, args: (string | number | boolean)[]): void;

  public didCatchValidationError(message: Discord.Message, errs: ValidationError[]) {
    errs.forEach(err => {
      message.channel.send(err.message);
    });
  }

  public shouldCommandDispatch?(message: Discord.Message): boolean;
  public willDispatch?(message: Discord.Message): void;
  public didSuccessfullyDispatch?(message: Discord.Message): void;
  public didFailedDispatch?(message: Discord.Message): void;
  public didLoad?(): void;
}
