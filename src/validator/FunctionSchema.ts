import Schema from './Schema';
import NebulaError from '../errors/NebulaError';

export default class FunctionSchema<T extends Function> extends Schema<T> {
  /**
   * The schema that represents functions
   * ```ts
   * const schema = Validator.function();
   * ```
   * Error type(s): `function.base`
   */
  constructor() {
    super('function');
  }

  protected check(value: unknown): value is T {
    return typeof value === 'function';
  }

  /**
   * Specifies that a function must inherit another constructor
   * ```ts
   * class MyConstructor {}
   *
   * const schema = Validator.function.inherit(MyConstructor);
   * ```
   * Error type(s): `function.inherit`
   * @param ctor The constructor to check against
   */
  inherit(ctor: unknown) {
    this.addRule(
      ({ value, deps }) => {
        if (!this.check(deps[0]))
          throw new NebulaError('The constructor to check against must be a function');

        return value.prototype instanceof deps[0];
      },
      'inherit',
      [ctor],
    );

    return this;
  }
}
