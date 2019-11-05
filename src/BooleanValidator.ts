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

  public coerce(value: string) {
    if (truthyValues.includes(value)) return true;
    if (falsyValues.includes(value)) return false;

    return null;
  }

  /**
   * Check if a value is truthy
   */
  public truthy() {
    this._checkBoolean();

    return this;
  }

  /**
   * Check if a value is falsy
   */
  public falsy() {
    this._checkBoolean(false);

    return this;
  }

  private _checkBoolean(isTruthy = true) {
    this.rules.push(({ value, rawValue, key }) => {
      if (value === isTruthy) return true;

      this.addError(rawValue, key, 'boolean.falsy');

      return false;
    });
  }
}
