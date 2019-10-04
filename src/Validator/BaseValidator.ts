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
