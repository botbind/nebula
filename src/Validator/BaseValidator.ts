import ValidationError from './ValidationError';
import { ValidationRule, ValidationFlags, CommandArgTypes } from './';

export default abstract class BaseValidator<T extends CommandArgTypes> {
  /**
   * The type of the validator
   */
  readonly type: string;

  /**
   * The flags of the validator
   */
  readonly flags: ValidationFlags;

  /**
   * The rules of the validator
   */
  readonly rules: ValidationRule<T>[];

  /**
   * The errors of the validator
   */
  readonly errs: ValidationError[];

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
   * Mark a value as required
   */
  require() {
    this.flags.required = true;

    return this;
  }

  /**
   * Check if a value is in a list of values
   * @param values The list of values
   */
  in(...values: CommandArgTypes[]) {
    if (!values.length) throw new TypeError('values must have at least 1 value');

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
  notIn(...values: CommandArgTypes[]) {
    if (!values.length) throw new TypeError('values must have at least 1 value');

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
  addRule(rule: ValidationRule<T>) {
    this.rules.push(rule);
  }

  /**
   * Add an error
   * @param value The raw value before coercing
   * @param key The key of the value in the value store
   * @param type The type of the rule
   */
  addError(value: string, key: string, type: string) {
    this.errs.push(new ValidationError(value, key, type));
  }

  /**
   * Coerce a value
   * @param value The value to coerce from
   */
  abstract coerce(value: any): CommandArgTypes | null;
}
