import BaseValidator from './BaseValidator';
import ValidationError from './ValidationError';

const truthyValues = ['true', '1', '+'];
const falsyValues = ['false', '0', '-'];

export default class BooleanValidator extends BaseValidator<boolean> {
  constructor() {
    super('boolean');

    this.schema.rules.push((value: string) => {
      if (this.coerce(value) !== null) return true;

      this.errs.push(new ValidationError(value, 'boolean'));

      return false;
    });
  }

  public coerce(value: string) {
    if (truthyValues.includes(value)) return true;
    if (falsyValues.includes(value)) return false;

    return null;
  }

  public truthy() {
    this.schema.rules.push((value: string) => {
      if (this.coerce(value)) return true;

      this.errs.push(new ValidationError(value, 'boolean.truthy'));

      return false;
    });

    return this;
  }

  public falsy() {
    this.schema.rules.push((value: string) => {
      const coerced = this.coerce(value);
      if (coerced !== null && !coerced) return true;

      this.errs.push(new ValidationError(value, 'boolean.falsy'));

      return false;
    });

    return this;
  }
}
