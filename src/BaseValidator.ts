import ValidationError from './ValidationError';
import { ValidationRule, ValidationFlags, Primitives } from './Validator';
import NebulaError from './NebulaError';

export default class BaseValidator<T extends Primitives> {
  /**
   * The type of the validator
   */
  public type: string;

  /**
   * The flags of the validator
   */
  public flags: ValidationFlags;

  /**
   * The rules of the validator
   */
  public rules: ValidationRule<T>[];

  /**
   * The errors of the validator
   */
  public errs: ValidationError[];

  /**
   * The base structure for all Nebula validators
   * @param type The type of the validator
   */
  constructor(type: string) {
    this.type = type;
    this.flags = {};
    this.rules = [];
    this.errs = [];
  }

  /**
   * Mark a value as optional
   */
  public optional() {
    this.flags.optional = true;

    return this;
  }

  /**
   * Check if a value is in a list of values
   * @param values The list of values
   */
  public in(...values: T[]) {
    this._checkPresence(values);

    return this;
  }

  /**
   * Check if a value is not in a list of values
   * @param values The list of values
   */
  public notIn(...values: T[]) {
    this._checkPresence(values, false);

    return this;
  }

  private _checkPresence(values: T[], shouldPresence = true) {
    const type = shouldPresence ? 'in' : 'notIn';

    if (values.length === 0)
      throw new NebulaError(`values for ${this.type}.${type} must have at least 1 value`);

    this.rules.push(({ value, rawValue, key }) => {
      if (values.includes(value) === shouldPresence) return true;

      this.addError(rawValue, key, `${this.type}.${type}`);

      return false;
    });
  }

  /**
   * Add an error
   * @param value The raw value before coercing
   * @param key The key of the value in the value store
   * @param type The type of the rule
   */
  protected addError(value: string, key: string, type: string) {
    this.errs.push(new ValidationError(value, key, type));
  }

  /**
   * Coerce a value
   * @param value The value to coerce from
   */
  public coerce?(value: string): Primitives | null;
}
