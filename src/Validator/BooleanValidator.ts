import BaseValidator from './BaseValidator';

const truthyValues = ['true', '1', '+', 'on', 'enable', 'enabled', 't', 'yes', 'y'];
const falsyValues = ['false', '0', '-', 'off', 'disable', 'disabled', 'f', 'no', 'n'];

export default class BooleanValidator extends BaseValidator<boolean> {
  /**
   * Boolean validator
   */
  constructor() {
    super('boolean');
  }

  coerce(value: string) {
    if (truthyValues.includes(value)) return true;
    if (falsyValues.includes(value)) return false;

    return null;
  }

  /**
   * Check if a value is truthy
   */
  truthy() {
    this.rules.push(({ value, rawValue, key }) => {
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
    this.rules.push(({ value, rawValue, key }) => {
      if (!value) return true;

      this.addError(rawValue, key, 'boolean.falsy');

      return false;
    });

    return this;
  }
}
