import Discord from 'discord.js';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
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

  protected abstract ready(message: Discord.Message): void;

  public shouldCommandReady?(message: Discord.Message): boolean;
  public loaded?(): void;
}
