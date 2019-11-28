import Validator from './Validator';
import Schema, {
  ValidatorOptions,
  MapToTypes,
  ValidationResults,
  ReferenceableValue,
} from './Schema';
import NebulaError from '../errors/NebulaError';
import Utils from '../utils/Utils';

function isPlainObject(value: unknown): value is object {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export default class ObjectSchema<T> extends Schema<MapToTypes<T>> {
  private _schemaMap: T | null;

  /**
   * The schema that represents the object data type
   * ```ts
   * const schema = Validator.object();
   * ```
   * Error type(s): `object.base`
   * @param schemaMap - The map of schemas
   */
  constructor(schemaMap?: T) {
    if (schemaMap != null && !isPlainObject(schemaMap))
      throw new NebulaError('The schema map for Nebula.ObjectSchema must be an object');

    super('object');

    this._schemaMap = schemaMap != null ? schemaMap : null;
  }

  protected check(value: unknown): value is MapToTypes<T> {
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
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'number')
          throw new NebulaError('The number of entries for object.length must be a number');

        return Object.keys(value).length === deps[0];
      },
      'length',
      [num],
    );

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
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'number')
          throw new NebulaError('The number of entries for object.min must be a number');

        return Object.keys(value).length >= deps[0];
      },
      'min',
      [num],
    );

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
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'number')
          throw new NebulaError('The number of entries for object.max must be a number');

        return Object.keys(value).length <= deps[0];
      },
      'max',
      [num],
    );

    return this;
  }

  /**
   * Specifies that an object to be an instance of a constructor
   * ```ts
   * const schema = Validator.instance();
   * ```
   * Error type(s): `object.instance`
   * @param ctor The constructor to check against
   */
  instance(ctor: unknown) {
    this.addRule(
      ({ value, deps }) => {
        if (typeof deps[0] !== 'function')
          throw new NebulaError(
            'The constructor to check again for object.instance must be a function',
          );

        return value instanceof deps[0];
      },
      'instance',
      [ctor],
    );

    return this;
  }

  public validate(value: unknown, options: ValidatorOptions = {}) {
    const { shouldAbortEarly = true, path } = options;
    const finalResults: ValidationResults<MapToTypes<T>> = {
      value: null,
      errors: [],
      pass: true,
    };
    const baseResults = super.validate(value, options);

    // Run this.check in case of optional without default value
    if (this._schemaMap == null || !baseResults.pass || !this.check(baseResults.value))
      return baseResults;

    if (path == null) Validator.setValue(baseResults.value as ReferenceableValue);

    // Partition independent and dependent schemas
    const partitioned = Utils.partition(
      Utils.entriesOf(this._schemaMap),
      ([, schema]) => ((schema as unknown) as Schema)._independent,
    );

    // Validate independent schemas first, then dependent ones
    for (const partitionedSchema of partitioned) {
      for (const [key, schema] of partitionedSchema) {
        const newValue = baseResults.value[key];
        const newOptions = {
          ...options,
          path: path == null ? key : `${path}.${key}`,
          parent: baseResults.value as ReferenceableValue,
        };

        let result;
        if (isPlainObject(schema) && !(schema instanceof Schema)) {
          result = new ObjectSchema(schema).validate(newValue, newOptions);
        } else {
          result = ((schema as unknown) as Schema).validate(newValue, newOptions);
        }

        finalResults.errors.push(...result.errors);

        if (!result.pass) {
          finalResults.pass = false;

          if (shouldAbortEarly) return finalResults;
        }
      }
    }

    if (!finalResults.pass) return finalResults;

    finalResults.value = baseResults.value;

    return finalResults;
  }
}
