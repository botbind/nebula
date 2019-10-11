import Discord from 'discord.js';
import BooleanValidator from './BooleanValidator';
import NumberValidator from './NumberValidator';
import StringValidator from './StringValidator';
import ValidationError from './ValidationError';

/**
 * The allowed command argument types
 */
export type CommandArgTypes = string | number | boolean;

/**
 * The validation schema
 */
export type Schema = Record<string, StringValidator | NumberValidator | BooleanValidator>;

/**
 * The value store entry when validating
 */
export interface ValueStoreEntry {
  value: CommandArgTypes;
  type: string;
  rawValue: string;
}

/**
 * The value store when validating
 */
export type ValueStore = Record<string, ValueStoreEntry>;

export interface ValidationRuleArguments<T extends CommandArgTypes> {
  /**
   * The coerced value to validate
   */
  value: T;

  /**
   * The raw value before coercing
   */
  rawValue: string;

  /**
   * The key of the value in the value store
   */
  key: string;

  /**
   * The function that returns a value store entry based on a ref key
   */
  ref: (key: string) => ValueStoreEntry;

  /**
   * The created message
   */
  message: Discord.Message;
}

/**
 * The validation rule
 */
export type ValidationRule<T extends CommandArgTypes = CommandArgTypes> = (
  arg: ValidationRuleArguments<T>,
) => boolean;

/**
 * The validated value store
 */
export type ValidationResults = Record<string, ValidationError[] | CommandArgTypes | null>;

/**
 * The validation flags
 */
export interface ValidationFlags {
  required?: boolean;
}

/**
 * The options of the validator
 */
export interface ValidatorOptions {
  /**
   * Whether the validator should abort on the first error
   */
  abortEarly: boolean;
  /**
   * Whether the validator should return coerced values
   */
  coerce: boolean;
}

export default class Validator {
  /**
   * Validate an array of values against a validation schema
   * @param message The created message
   * @param values The values to validate
   * @param schema The validation schema
   * @param options The options of the validator
   */
  static validate(
    message: Discord.Message,
    values: string[],
    schema: Schema,
    options: ValidatorOptions,
  ): ValidationResults {
    const valueStore: ValueStore = {};
    const validatorEntries = Object.entries(schema);

    for (let i = 0; i < validatorEntries.length; i++) {
      const [currKey, currValidator] = validatorEntries[i];
      const currValue = values[i];
      const err = [new ValidationError(currValue, currKey, currValidator.type)];

      if (currValue === undefined) {
        if (currValidator.flags.required)
          return {
            [currKey]: err,
          };

        return {
          [currKey]: null,
        };
      }

      const coerced = currValidator.coerce(currValue);

      if (coerced === null)
        return {
          [currKey]: err,
        };

      valueStore[currKey] = {
        value: coerced,
        type: currValidator.type,
        rawValue: currValue,
      };
    }

    let hasErrors = false;
    const results: ValidationResults = {};

    for (let i = 0; i < validatorEntries.length; i++) {
      const [currKey, currValidator] = validatorEntries[i];
      const { value } = valueStore[currKey];
      const currRawValue = values[i];

      // Empty the errors array
      currValidator.errs.length = 0;

      for (const rule of currValidator.rules) {
        const result = (rule as ValidationRule)({
          value,
          rawValue: currRawValue,
          key: currKey,
          ref: (refKey: string) => valueStore[refKey],
          message,
        });

        if (!result && options.abortEarly)
          return {
            [currKey]: currValidator.errs,
          };
      }

      if (currValidator.errs.length) {
        hasErrors = true;
        results[currKey] = currValidator.errs;
      } else {
        results[currKey] = options.coerce ? valueStore[currKey].value : currRawValue;
      }
    }

    return results;
  }

  static boolean() {
    return new BooleanValidator();
  }

  static number() {
    return new NumberValidator();
  }

  static string() {
    return new StringValidator();
  }
}
