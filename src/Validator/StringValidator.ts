import BaseValidator from './BaseValidator';
import Util from '../Util';
import NebulaError from '../NebulaError';

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
    if (!Util.isNumber(size)) throw new NebulaError('size must be a number');

    this.addRule(({ value, rawValue, key }) => {
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
    if (!Util.isNumber(size)) throw new NebulaError('size must be a number');

    this.addRule(({ value, rawValue, key }) => {
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
    if (!Util.isNumber(size)) throw new NebulaError('size must be a number');

    this.addRule(({ value, rawValue, key }) => {
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
    if (!(regex instanceof RegExp)) throw new NebulaError('regex must be a RegExp');

    this.addRule(({ value, rawValue, key }) => {
      if (regex.test(value)) return true;

      this.addError(rawValue, key, 'string.test');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is a user mention
   */
  user() {
    this._testDiscordStrings('user');

    return this;
  }

  /**
   * Check if a value is a channel mention
   */
  channel() {
    this._testDiscordStrings('channel');

    return this;
  }

  /**
   * Check if a value is an emoji mention
   */
  emoji() {
    this._testDiscordStrings('emoji');

    return this;
  }

  /**
   * Check if a value is a role mention
   */
  role() {
    this._testDiscordStrings('role');

    return this;
  }

  /**
   * Check if a value is a discord snowflake
   */
  snowflake() {
    this._testDiscordStrings('snowflake');

    return this;
  }

  private _testDiscordStrings(type: string) {
    this.addRule(({ value, rawValue, key, message }) => {
      const enhancedType = `string.${type}`;
      let regex;
      let collection;

      switch (type) {
        case 'user':
          regex = /^(?:<@!?)?(\d{17,19})>?$/;
          collection = message.guild.members;
          break;
        case 'channel':
          regex = /^(?:<#)?(\d{17,19})>?$/;
          collection = message.guild.channels;
          break;
        case 'emoji':
          regex = /^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/;
          collection = message.guild.emojis;
          break;
        case 'role':
          regex = /^(?:<@&)?(\d{17,19})>?$/;
          collection = message.guild.roles;
          break;
        case 'snowflake':
          regex = /^(\d{17,19})$/;
          collection = null;
          break;
        default:
          return false;
      }

      const matches = value.match(regex);

      if (!matches) {
        this.addError(rawValue, key, enhancedType);

        return false;
      }

      if (!collection || collection.has(matches[1])) return true;

      this.addError(rawValue, key, enhancedType);

      return false;
    });
  }
}
