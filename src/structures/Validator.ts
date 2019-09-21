import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import ValidationError from './ValidationError';
import { ValidatorOptions, ValidatorFunc, ValidationResults } from 'src/types';

const defaultOptions = {
  abortEarly: true,
  coerce: true,
};

const truthyValues = ['true', '1', 1, '+'];
const falsyValues = ['false', '0', 0, '-'];

// More validation rules to come...
export default class Validator {
  private options: ValidatorOptions & typeof defaultOptions;

  constructor(options: ValidatorOptions = {}) {
    if (!isPlainObject(options)) throw new TypeError('valitorOptions must be an object');

    const mergedOptions = merge(defaultOptions, options);

    this.options = mergedOptions;
  }

  public static any(value: string): ValidationResults<string> {
    return [null, value];
  }

  public static boolean(value: string): ValidationResults<boolean> {
    if (truthyValues.includes(value)) return [null, true];
    if (falsyValues.includes(value)) return [null, false];

    return [[new ValidationError(`value ${value} is not a boolean`, 'boolean')], null];
  }

  public static number(value: string): ValidationResults<number> {
    const coerced = Number(value);

    if (isNaN(coerced))
      return [[new ValidationError(`value ${value} is not a number`, 'number')], null];

    return [null, coerced];
  }

  public static integer(value: string): ValidationResults<number> {
    const [err, coerced] = Validator.number(value);

    if (err) return [err, null];

    if (!Number.isInteger(coerced!))
      return [[new ValidationError(`value ${value} is not an integer`, 'integer')], null];

    return [null, coerced];
  }

  public static range(min?: number, max?: number) {
    return (value: string): ValidationResults<number> => {
      const [err, coerced] = Validator.number(value);

      if (err) return [err, null];

      if ((min == null || coerced! >= min) && (max == null || coerced! <= max))
        return [null, coerced];

      return [
        [
          new ValidationError(
            `value ${value} is not ${min != null ? `greater than ${min} and` : ''} ${
              max != null ? `smaller than ${max}` : ''
            }`,
            'range',
          ),
        ],
        null,
      ];
    };
  }

  public compose(...validators: ValidatorFunc[]) {
    if (!validators.length) throw new Error('validator.compose() expects at least a validator');

    return (value: string): ValidationResults => {
      let coercedValue;
      const errorCollector: ValidationError[] = [];

      for (const validator of validators) {
        const [err, validatedValue] = validator(value);

        coercedValue = validatedValue;

        if (err) {
          errorCollector.push(...err);

          if (this.options.abortEarly) break;
        }
      }

      return [
        errorCollector.length ? errorCollector : null,
        this.options.coerce ? (coercedValue as string | number | boolean | null) : value,
      ];
    };
  }
}
