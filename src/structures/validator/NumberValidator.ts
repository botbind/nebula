import BaseValidator from './BaseValidator';
import ValidationError from './ValidationError';

export default class NumberValidator extends BaseValidator<number> {
  constructor() {
    super('number');

    this.schema.rules.push((value: string) => {
      if (this.coerce(value) !== null) return true;

      this.errs.push(new ValidationError(value, 'number'));

      return false;
    });
  }

  public coerce(value: string) {
    const coerced = Number(value);

    if (!isNaN(coerced)) return coerced;

    return null;
  }

  public integer() {
    this.schema.rules.push((value: string) => {
      const coerced = this.coerce(value);

      if (coerced !== null && Number.isInteger(coerced)) return true;

      this.errs.push(new ValidationError(value, 'number.integer'));

      return false;
    });

    return this;
  }

  public range(min?: number, max?: number) {
    this.schema.rules.push((value: string) => {
      const coerced = this.coerce(value);

      if (coerced !== null && ((!min || coerced >= min) && (!max || coerced <= max))) return true;

      this.errs.push(new ValidationError(value, 'number.range'));

      return false;
    });

    return this;
  }
}
