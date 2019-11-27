import Schema from './Schema';
import NebulaError from '../errors/NebulaError';

export default class NumberSchema extends Schema<number> {
  /**
   * The schema that represents the number data type
   * ```ts
   * const schema = Validator.number();
   *
   * // Pass
   * const result = schema.validate(1);
   *
   * // Fail
   * const result = schema.validate('a');
   * const result = schema.validate(true);
   * const result = schema.validate(new Date());
   * const result = schema.validate([]);
   * const result = schema.validate({});
   * ```
   * Error type(s): `number`
   */
  constructor() {
    super('number');
  }

  protected check(value: unknown): value is number {
    return typeof value === 'number';
  }

  protected coerce(value: string) {
    const coerce = Number(value);

    if (!Number.isNaN(coerce)) return coerce;

    return null;
  }

  /**
   * Specifies that a number must be an integer
   * ```ts
   * const schema = Validator.number().integer();
   * ```
   * Error type(s): `number.integer`
   */
  public integer() {
    this.addRule(({ value }) => Number.isInteger(value), 'integer');

    return this;
  }

  /**
   * Specifies a minimum value for a number
   * ```ts
   * const schema = Validator.number().min(5);
   * ```
   * Error type(s): `number.min`
   * @param num The minimum value
   */
  public min(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (!this.check(resolved))
        throw new NebulaError('The minimum value for number.min must be a number');

      return value >= resolved;
    }, 'min');

    return this;
  }

  /**
   * Specifies a maximum value for a number
   * ```ts
   * const schema = Validator.number().max(5);
   * ```
   * Error type(s): `number.max`
   * @param num The maximum value
   */
  public max(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (!this.check(resolved))
        throw new NebulaError('The maximum value for number.max must be a number');

      return value <= resolved;
    }, 'max');

    return this;
  }

  /**
   * Specifies that a number must be a multiple of another
   * ```ts
   * const schema = Validator.number().multiple(2);
   * ```
   * Error type(s): `number.multiple`
   * @param num The number to check against
   */
  public multiple(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (!this.check(resolved))
        throw new NebulaError('The number to check against for number.multiple must be a number');

      return value % resolved === 0;
    }, 'multiple');

    return this;
  }

  /**
   * Specifies that a number must divide another
   * ```ts
   * const schema = Validator.number().divide(4);
   * ```
   * Error type(s): `number.divide`
   * @param num The number to check against
   */
  public divide(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (!this.check(resolved))
        throw new NebulaError('The number to check against for number.divide must be a number');

      return resolved % value === 0;
    }, 'divide');

    return this;
  }

  /**
   * Specifies that a number must be greater than another
   * ```ts
   * const schema = Validator.number().greater(5);
   * ```
   * Error type(s): `number.greater`
   * @param num The number to compare to
   */
  public greater(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (!this.check(resolved))
        throw new NebulaError('The number to compare to for number.greater must be a number');

      return value > resolved;
    }, 'greater');

    return this;
  }

  /**
   * Specifies that a number must be smaller than another
   * ```ts
   * const schema = Validator.number().smaller(5);
   * ```
   * Error type(s): `number.smaller`
   * @param num The number to compare to
   */
  public smaller(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (!this.check(resolved))
        throw new NebulaError('The number to compare to for number.smaller must be a number');

      return value < resolved;
    }, 'smaller');

    return this;
  }
}
