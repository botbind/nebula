import isPlainObject from 'lodash/isPlainObject';
import { TaskOptions } from '../types';

export default class Task {
  public readonly name: string;
  public readonly options: Omit<TaskOptions, 'name'>;

  constructor(options: TaskOptions) {
    if (!isPlainObject(options)) throw new TypeError('commandOptions must be an object');

    const { name, ...rest } = options;

    this.name = name;
    this.options = rest;
  }

  public loaded?(): void;
  public ready?(): void;
}
