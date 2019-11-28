import Schema from './Schema';
import NebulaError from '../errors/NebulaError';

export default class DateSchema extends Schema<Date> {
  /**
   * The schema that represents the Date object
   * ```ts
   * const schema = Validator.date();
   * ```
   * Error type(s): `date.base`
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
    this.addRule(
      ({ value, deps }) => {
        if (!this.check(deps[0]))
          throw new NebulaError(
            'The date to compare to for date.older must be an instance of Date',
          );

        return value >= deps[0];
      },
      'older',
      [date],
    );

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
    this.addRule(
      ({ value, deps }) => {
        if (!this.check(deps[0]))
          throw new NebulaError(
            'The date to compare to for date.newer must be an instance of Date',
          );

        return value <= deps[0];
      },
      'newer',
      [date],
    );

    return this;
  }
}
