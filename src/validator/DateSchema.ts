import Schema from './Schema';
import NebulaError from '../errors/NebulaError';

export default class DateSchema extends Schema<Date> {
  /**
   * The schema that represents the Date object
   * ```ts
   * const schema = Validator.date();
   *
   * // Pass
   * const result = schema.validate(new Date());
   *
   * // Fail
   * const result = schema.validate('a');
   * const result = schema.validate(1);
   * const result = schema.validate(true);
   * const result = schema.validate([]);
   * const result = schema.validate({});
   * ```
   * Error type(s): `date`
   */
  constructor() {
    super('date');
  }

  protected check(value: unknown): value is Date {
    return value instanceof Date;
  }

  protected coerce(value: string) {
    const timestamp = Date.parse(value);

    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp);
    }

    return null;
  }

  /**
   * Specifies that a date must be older than another
   * ```ts
   * const schema = Validator.date().older(new Date('01/01/2019'));
   * ```
   * Error type(s): `date.older`
   * @param date The date to compare to
   */
  older(date: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(date);

      if (!this.check(resolved))
        throw new NebulaError('The date to compare to for date.older must be an instance of Date');

      return value >= resolved;
    }, 'older');

    return this;
  }

  /**
   * Specifies that a date must be newer than another
   * ```ts
   * const schema = Validator.date().newer(new Date('01/01/2019'));
   * ```
   * Error type(s): `date.newer`
   * @param date The date to compare to
   */
  newer(date: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(date);

      if (!this.check(resolved))
        throw new NebulaError('The date to compare to for date.newer must be an instance of Date');

      return value <= resolved;
    }, 'newer');

    return this;
  }
}
