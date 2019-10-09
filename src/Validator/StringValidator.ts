import BaseValidator from './BaseValidator';
import Util from '../Util';

export default class StringValidator extends BaseValidator<string> {
  /**
   * String validator
   */
  constructor() {
    super('string');
  }

  coerce(value: string) {
    return value;
  }

  /**
   * Check if a value has a specific length
   * @param size The size of the value
   */
  length(size: number) {
    if (!Util.isNumber(size)) throw new TypeError('size must be a number');

    this.addRule((value, rawValue, key) => {
      if (value.length === size) return true;

      this.addError(rawValue, key, 'string.length');

      return false;
    });

    return this;
  }

  /**
   * Check if a value has at least specific length
   * @param size The size of the value
   */
  min(size: number) {
    if (!Util.isNumber(size)) throw new TypeError('size must be a number');

    this.addRule((value, rawValue, key) => {
      if (value.length >= size) return true;

      this.addError(rawValue, key, 'string.min');

      return false;
    });

    return this;
  }

  /**
   * Check if a value has at most a specific length
   * @param size The size of the value
   */
  max(size: number) {
    if (!Util.isNumber(size)) throw new TypeError('size must be a number');

    this.addRule((value, rawValue, key) => {
      if (value.length <= size) return true;

      this.addError(rawValue, key, 'string.max');

      return false;
    });

    return this;
  }

  /**
   * Test a value against a regular expression
   * @param regex The regular express to check against
   */
  test(regex: RegExp) {
    if (!(regex instanceof RegExp)) throw new TypeError('regex must be a RegExp');

    this._testRegex(regex, 'string.test');

    return this;
  }

  /**
   * Check if a value is a user mention
   */
  user() {
    this._testRegex(/^(?:<@!?)?(\d{17,19})>?$/, 'string.user');

    return this;
  }

  /**
   * Check if a value is a channel mention
   */
  channel() {
    this._testRegex(/^(?:<#)?(\d{17,19})>?$/, 'string.channel');

    return this;
  }

  /**
   * Check if a value is an emoji mention
   */
  emoji() {
    this._testRegex(/^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/, 'string.emoji');

    return this;
  }

  /**
   * Check if a value is a role mention
   */
  role() {
    this._testRegex(/^(?:<@&)?(\d{17,19})>?$/, 'string.role');

    return this;
  }

  /**
   * Check if a value is a discord snowflake
   */
  snowflake() {
    this._testRegex(/^(\d{17,19})$/, 'string.snowflake');

    return this;
  }

  private _testRegex(regex: RegExp, type: string) {
    this.addRule((value, rawValue, key) => {
      if (regex.test(value)) return true;

      this.addError(rawValue, key, type);

      return false;
    });
  }
}
