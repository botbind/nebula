import Schema, { ValidatorOptions, ValidationResults } from './Schema';
import NebulaError from '../errors/NebulaError';

export default class ArraySchema<T> extends Schema<T[]> {
  private _schema: Schema<T> | null;

  /**
   * The schema that represents the array data type.
   * ```ts
   * const schema = Validator.array();
   * ```
   * Error type(s): `array.base`
   * @param schema The schema of the array items, if applicable
   */
  constructor(schema?: Schema<T>) {
    if (schema != null && !(schema instanceof Schema))
      throw new NebulaError(
        'The schema for the array items must be an instance of the Nebula.Schema base constructor',
      );

    super('array');

    this._schema = schema != null ? schema : null;
  }

  protected check(value: unknown): value is T[] {
    return Array.isArray(value);
  }

  /**
   * Specifies that an array must have an exact number of items
   * ```ts
   * const schema = Validator.array().length(3);
   * ```
   * Error type(s): `array.length`
   * @param num The number of items
   */
  public length(num: unknown) {
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'number')
          throw new NebulaError('The number of items for array.length must be a number');

        return value.length === deps[0];
      },
      'length',
      [num],
    );

    return this;
  }

  /**
   * Specifies that an array must have a minimum number of items
   * ```ts
   * const schema = Validator.array().min(3);
   * ```
   * Error type(s): `array.min`
   * @param num The number of items
   */
  public min(num: unknown) {
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'number')
          throw new NebulaError('The number of items for array.min must be a number');

        return value.length >= deps[0];
      },
      'min',
      [num],
    );

    return this;
  }

  /**
   * Specifies that an array must have a maximum number of items
   * ```ts
   * const schema = Validator.array().max(3);
   * ```
   * Error type(s): `array.max`
   * @param num The number of items
   */
  public max(num: unknown) {
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'number')
          throw new NebulaError('The number of items for array.max must be a number');

        return value.length <= deps[0];
      },
      'max',
      [num],
    );

    return this;
  }

  public validate(value: unknown, options: ValidatorOptions = {}) {
    const { shouldAbortEarly = true, path } = options;
    const finalResult: ValidationResults<T[]> = {
      value: null,
      errors: [],
      pass: true,
    };

    // Run base validation
    const baseResult = super.validate(value, options);

    // Run this.check in case of optional without default value
    if (this._schema == null || !baseResult.pass || !this.check(baseResult.value))
      return baseResult;

    for (let i = 0; i < baseResult.value.length; i += 1) {
      const result = this._schema.validate(baseResult.value[i], {
        ...options,
        path: path == null ? i.toString() : `${path}.${i}`,
        parent: baseResult.value,
      });

      finalResult.errors.push(...result.errors);

      if (!result.pass) {
        finalResult.pass = false;

        if (shouldAbortEarly) return finalResult;
      }
    }

    if (!finalResult.pass) return finalResult;

    finalResult.value = baseResult.value;

    return finalResult;
  }
}
