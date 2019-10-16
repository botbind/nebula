import ValidationError from './ValidationError';
import { ValidationRule, ValidationFlags, Primitives } from '.';
import NebulaError from '../NebulaError';

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
   * The base class for all Nebula validators
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
    if (!values.length)
      throw new NebulaError(`values for ${this.type}.in must have at least 1 value`);

    this.addRule(({ value, rawValue, key }) => {
      if (values.includes(value)) return true;

      this.addError(rawValue, key, `${this.type}.in`);

      return false;
    });

    return this;
  }

  /**
   * Check if a value is not in a list of values
   * @param values The list of values
   */
  public notIn(...values: T[]) {
    if (!values.length)
      throw new NebulaError(`values for ${this.type}.notIn must have at least 1 value`);

    this.addRule(({ value, rawValue, key }) => {
      if (!values.includes(value)) return true;

      this.addError(rawValue, key, `${this.type}.notIn`);

      return false;
    });

    return this;
  }

  /**
   * Add a validation rule
   * @param rule The validation rule
   */
  public addRule(rule: ValidationRule<T>) {
    this.rules.push(rule);
  }

  /**
   * Add an error
   * @param value The raw value before coercing
   * @param key The key of the value in the value store
   * @param type The type of the rule
   */
  public addError(value: string, key: string, type: string) {
    this.errs.push(new ValidationError(value, key, type));
  }

  /**
   * Coerce a value
   * @param value The value to coerce from
   */
  public coerce?(value: string): Primitives | null;
}
