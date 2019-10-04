import BaseValidator from './BaseValidator';

const truthyValues = ['true', '1', '+'];
const falsyValues = ['false', '0', '-'];

export default class BooleanValidator extends BaseValidator<boolean> {
  /**
   * Boolean validator
   */
  constructor() {
    super('boolean');
  }

  coerce(value: any) {
    if (truthyValues.includes(value)) return true;
    if (falsyValues.includes(value)) return false;

    return null;
  }

  /**
   * Check if a value is truthy
   */
  truthy() {
    this.rules.push((value, rawValue, key) => {
      if (value) return true;

      this.addError(rawValue, key, 'boolean.truthy');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is falsy
   */
  falsy() {
    this.rules.push((value, rawValue, key) => {
      if (!value) return true;

      this.addError(rawValue, key, 'boolean.falsy');

      return false;
    });

    return this;
  }
}
