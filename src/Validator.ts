import Discord from 'discord.js';
import merge from 'lodash.merge';
import BooleanValidator from './BooleanValidator';
import NumberValidator from './NumberValidator';
import StringValidator from './StringValidator';
import ValidationError from './ValidationError';
import NebulaError from './NebulaError';
import Util from './Util';

/**
 * The allowed command argument types
 */
export type Primitives = string | number | boolean;

/**
 * The validation schema
 */
export interface Schema {
  [x: string]: StringValidator | NumberValidator | BooleanValidator;
}

/**
 * The value store entry when validating
 */
export interface ValueStoreEntry {
  value: Primitives;
  type: string;
  rawValue: string;
}

/**
 * The value store when validating
 */
export interface ValueStore {
  [x: string]: ValueStoreEntry;
}

export interface ValidationRuleArguments<T extends Primitives> {
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
   * The value store
   */
  valueStore: ValueStore;

  /**
   * The created message
   */
  message: Discord.Message;
}

/**
 * The validation rule
 */
export type ValidationRule<T extends Primitives = Primitives> = (
  arg: ValidationRuleArguments<T>,
) => boolean;

/**
 * The validation errors
 */
export interface ValidationErrors {
  [x: string]: ValidationError[];
}

/**
 * The validation results
 */
export interface ValidationResults {
  [x: string]: Primitives | null;
}

/**
 * The validation flags
 */
export interface ValidationFlags {
  /**
   * Whether the value being validated is optiona;
   */
  optional?: boolean;
}

/**
 * The optinal options passed as argument to the validator
 */
export interface OptionalValidatorOptions {
  /**
   * Whether the validator should abort on the first error
   */
  abortEarly?: boolean;

  /**
   * Whether the validator should return coerced values
   */
  coerce?: boolean;
}

/**
 * The options for the validator
 */
export type ValidatorOptions = Required<OptionalValidatorOptions>;

const defaultOptions: ValidatorOptions = {
  abortEarly: true,
  coerce: true,
};

export default class Validator {
  /**
   * The options for the validator
   * @param options
   */
  public options: ValidatorOptions;

  constructor(options: OptionalValidatorOptions = {}) {
    if (!Util.isObject(options))
      throw new NebulaError('The options for the validator must be an object');

    this.options = merge({}, defaultOptions, options);
  }

  /**
   * Validate an array of values against a validation schema
   * @param message The created message
   * @param values The values to validate
   * @param schema The validation schema
   */
  public validate(
    message: Discord.Message,
    values: string[],
    schema: Schema,
  ): ValidationResults | ValidationErrors {
    const valueStore: ValueStore = {};
    const validatorEntries = Util.entriesOf(schema);

    for (let i = 0; i < validatorEntries.length; i += 1) {
      const [currKey, currValidator] = validatorEntries[i];
      const currValue = values[i];
      const err = [new ValidationError(currValue, currKey, currValidator.type)];

      if (currValue == null) {
        if (!currValidator.flags.optional)
          return {
            [currKey]: err,
          };

        return {
          [currKey]: null,
        };
      }

      const coerced = currValidator.coerce(currValue);

      if (coerced == null)
        return {
          [currKey]: err,
        };

      valueStore[currKey] = {
        value: coerced,
        type: currValidator.type,
        rawValue: currValue,
      };
    }

    const results: ValidationResults | ValidationErrors = {};

    for (let i = 0; i < validatorEntries.length; i += 1) {
      const [currKey, currValidator] = validatorEntries[i];
      const { value } = valueStore[currKey];
      const currRawValue = values[i];

      // Empty the errors array
      currValidator.errs = [];

      for (const rule of currValidator.rules) {
        const result = (rule as ValidationRule)({
          value,
          rawValue: currRawValue,
          key: currKey,
          valueStore,
          message,
        });

        if (!result && this.options.abortEarly)
          return {
            [currKey]: currValidator.errs,
          };
      }

      if (currValidator.errs.length) {
        results[currKey] = currValidator.errs;
      } else {
        results[currKey] = this.options.coerce ? valueStore[currKey].value : currRawValue;
      }
    }

    return results;
  }

  public static boolean() {
    return new BooleanValidator();
  }

  public static number() {
    return new NumberValidator();
  }

  public static string() {
    return new StringValidator();
  }
}
