import Schema, { SchemaTypes } from './Schema';
import NebulaError from '../errors/NebulaError';

export default class MiscSchema<T extends SchemaTypes> extends Schema<T> {
  /**
   * The schema that consists of miscellaneous rules
   */
  constructor() {
    super('misc');
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  protected check(value: unknown): value is T {
    return true;
  }

  /**
   * Specifies that a value must be an instance of a constructor
   * @param constructor The constructor to check against
   */
  public instanceOf(constructor: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(constructor);

      if (typeof resolved !== 'function')
        throw new NebulaError(
          'The constructor to check against for misc.instanceOf must be a constructor function or a class',
        );

      return value instanceof resolved;
    }, 'instanceOf');

    return this;
  }

  /**
   * Specifies that a value must inherit a constructor
   * @param constructor The constructor to check against
   */
  public inherit(constructor: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(constructor);

      if (typeof resolved !== 'function')
        throw new NebulaError(
          'The constructor to check against for misc.inherit must be a constructor function or a class',
        );

      return typeof value === 'function' && value.prototype instanceof resolved;
    }, 'inherit');

    return this;
  }
}
