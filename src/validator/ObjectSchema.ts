import Validator from './Validator';
import Schema, { ValidatorOptions, ReturnTypes, SchemaMap, ValidationResults } from './Schema';
import NebulaError from '../errors/NebulaError';
import Utils from '../utils/Utils';

function isPlainObject(value: unknown): value is object {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export default class ObjectSchema<T extends SchemaMap> extends Schema<ReturnTypes<T>> {
  private _schemaMap: T | null;

  /**
   * The schema that represents the object data type
   * ```ts
   * const schema = Validator.object();
   *
   * // Pass
   * const result = schema.validate({});
   *
   * // Fail
   * const result = schema.validate('a');
   * const result = schema.validate(1);
   * const result = schema.validate(true);
   * const result = schema.validate(new Date());
   * const result = schema.validate([]);
   * ```
   * Error type(s): `object`
   * @param schemaMap - The map of schemas
   */
  constructor(schemaMap: T) {
    if (schemaMap != null && !isPlainObject(schemaMap))
      throw new NebulaError('The schema map for Nebula.ObjectSchema must be an object');

    super('object');

    this._schemaMap = schemaMap;
  }

  protected check(value: unknown): value is ReturnTypes<T> {
    return isPlainObject(value);
  }

  /**
   * Specifies that an object must have an exact number of entries
   * ```ts
   * const schema = Validator.object().length(3);
   * ```
   * Error type(s): `object.length`
   * @param num The number of entries
   */
  public length(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (typeof resolved !== 'number')
        throw new NebulaError('The number of entries for object.length must be a number');

      return Object.keys(value).length === resolved;
    }, 'length');

    return this;
  }

  /**
   * Specifies that an object must have a minimum number of entries
   * ```ts
   * const schema = Validator.object().min(3);
   * ```
   * Error type(s): `object.min`
   * @param num The number of entries
   */
  public min(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (typeof resolved !== 'number')
        throw new NebulaError('The number of entries for object.min must be a number');

      return Object.keys(value).length >= resolved;
    }, 'min');

    return this;
  }

  /**
   * Specifies that an object must have a maximum number of entries
   * ```ts
   * const schema = Validator.object().max(3);
   * ```
   * Error type(s): `object.max`
   * @param num The number of entries
   */
  public max(num: unknown) {
    this.addRule(({ value }) => {
      const resolved = this.resolve(num);

      if (typeof resolved !== 'number')
        throw new NebulaError('The number of entries for object.max must be a number');

      return Object.keys(value).length <= resolved;
    }, 'max');

    return this;
  }

  private _deepValidate(value: unknown, schemaMap: T | null, options: ValidatorOptions = {}) {
    const { shouldAbortEarly = true, path } = options;
    const finalResults: ValidationResults<ReturnTypes<T>> = {
      value: null,
      errors: [],
      pass: true,
    };
    const baseResults = super.validate(value, options);

    // Run this.check in case of optional without default value
    if (schemaMap == null || !baseResults.pass || !this.check(baseResults.value))
      return baseResults;

    if (path == null) Validator.setValue(baseResults.value);

    for (const key of Utils.keysOf(schemaMap)) {
      const schema = schemaMap[key];
      const newValue = baseResults.value[key];
      const newOptions = {
        ...options,
        path: path == null ? key : `${path}.${key}`,
        parent: baseResults.value,
      };

      let result;
      if (isPlainObject(schema) && !(schema instanceof Schema)) {
        result = this._deepValidate(newValue, (schema as unknown) as T, newOptions);
      } else {
        result = schema.validate(newValue, newOptions);
      }

      finalResults.errors.push(...result.errors);

      if (!result.pass) {
        finalResults.pass = false;

        if (shouldAbortEarly) return finalResults;
      }
    }

    if (!finalResults.pass) return finalResults;

    finalResults.value = baseResults.value;

    return finalResults;
  }

  public validate(value: unknown, options: ValidatorOptions = {}) {
    return this._deepValidate(value, this._schemaMap, options);
  }
}
