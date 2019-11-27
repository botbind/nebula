import Discord from 'discord.js';
import Ref from './Ref';
import ValidationError from '../errors/ValidationError';
import NebulaError from '../errors/NebulaError';

// TODO: Make ref work with default value
// Potential fix: Validate the dependency before resolving ref

/**
 * The allowed schema types
 */
export type SchemaTypes =
  | string
  | number
  | boolean
  | object
  | Date
  | SchemaTypes[]
  | Function
  | { [key: string]: SchemaTypes };

/**
 * The map of schemas
 */
export interface SchemaMap {
  [key: string]: Schema | SchemaMap;
}

/**
 * Referenceable value as object
 */
export interface ReferenceableObject {
  [key: string]: unknown;
}

/**
 * Referenceable value
 */
export type ReferenceableValue = ReferenceableObject | unknown[];

/**
 * Converts to an equivalent schema types from a map
 */
export type ReturnTypes<T extends SchemaMap> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

/**
 * The schema rule argument object
 */
export interface SchemaRuleArg<T extends SchemaTypes> {
  /**
   * The coerced value to validate
   */
  value: T;

  /**
   * The raw value before coercing
   */
  rawValue: unknown;

  /**
   * The Discord message that triggers the validation
   */
  message?: Discord.Message;
}

/**
 * The schema rule
 */
export type SchemaRule<T extends SchemaTypes> = (arg: SchemaRuleArg<T>) => boolean;

/**
 * The validation results
 */
export interface ValidationResults<T extends SchemaTypes> {
  value: T | null;
  errors: ValidationError[];
  pass: boolean;
}

/**
 * The options for the validator
 */
export interface ValidatorOptions {
  /**
   * Whether the validator should abort on the first error
   */
  shouldAbortEarly?: boolean;

  /**
   * The Discord message that triggers the validation
   */
  message?: Discord.Message;

  /**
   * The path referencing the value. Used internally
   */
  path?: string;

  /**
   * The parent containing the value. Used internally
   */
  parent?: ReferenceableValue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class Schema<T extends SchemaTypes = any> {
  private _type: string;

  private _label: string;

  private _path: string | null;

  private _isOptional: boolean;

  // This should be private, however array and object needs to populate defaults before validating
  // due to the nature of ref
  public _default: T | null;

  private _rules: SchemaRule<T>[];

  private _errs: ValidationError[];

  /**
   * The base constructor which is inherited to create schemas.
   * ```ts
   * class MyFancySchema extends Schema<string> {
   *  constructor() {
   *    super('fancy-string');
   *  }
   *
   *  protected check(value: unknown): value is string {
   *    return typeof value === 'string';
   *  }
   *
   *  protected coerce(value: string) {
   *    // Do your fancy coerce in here
   *  }
   *
   *  public myFancyMethod(myFancyParam: unknown) {
   *    this.addRule(({ value }) => {
   *      // Resolve the parameter
   *      const resolved = this.resolve(myFancyParam);
   *
   *      // Return a rule condition
   *      return value === resolved;
   *    }, 'fancy-method');
   *
   *    return this;
   *  }
   * }
   * ```
   * @param type The type of the validator
   */
  constructor(type: string) {
    this._type = type;
    this._label = 'unknown';
    this._path = null;
    this._isOptional = false;
    this._default = null;
    this._rules = [];
    this._errs = [];
  }

  /**
   * Coerces a value
   * @param value The value to coerce from
   */
  protected coerce?(value: string): T | null;

  /**
   * The base check
   * @param value The value to check
   */
  protected abstract check(value: unknown): value is T;

  /**
   * Resolves a value or a reference
   * @param resolvable The data to resolve
   */
  protected resolve(resolvable: unknown): unknown {
    return resolvable instanceof Ref ? resolvable.resolve() : resolvable;
  }

  /**
   * Specifies a label for the schema for debugging purposes
   * @param label The label of the validator
   */
  public label(label: unknown) {
    if (typeof label !== 'string')
      throw new NebulaError('The label of the schema must be a string');

    this._label = label;

    return this;
  }

  /**
   * Specifies that the schema as optional
   */
  public optional() {
    this._isOptional = true;

    return this;
  }

  /**
   * Specifies the default value
   * @param value The default value of the validator
   */
  public default(value: unknown) {
    if (!this._isOptional)
      throw new NebulaError('The schema must be optional to have a default value');

    if (!this.check(value)) throw this.createError(value);

    this._default = value;

    return this;
  }

  /**
   * Specifies allowed values for the schema
   * @param values The list of allowed values
   */
  public allow(...values: unknown[]) {
    this.addRule(({ value }) => {
      const resolved = values.map(value2 => this.resolve(value2));

      if (resolved.length === 0)
        throw new NebulaError(
          `The allowed values for ${this._type}.allow must have at least a value`,
        );

      return values.map(value2 => this.resolve(value2)).includes(value);
    }, 'allow');

    return this;
  }

  /**
   * Creates a validation error
   * @param rawValue The raw value before coercing
   * @param type The type of the validator
   * @param label The label of the validator
   */
  protected createError(rawValue: unknown, type: string = this._type) {
    return new ValidationError(
      rawValue,
      type,
      `${this._label} at ${this._path == null ? '' : this._path}`,
    );
  }

  /**
   * Adds a validation error
   * @param rawValue The raw value before coercing
   * @param type The type of the validator
   * @param label The label of the validator
   */
  protected addError(rawValue: unknown, type?: string) {
    this._errs.push(this.createError(rawValue, type));
  }

  /**
   * Clears all stored errors
   */
  protected clearErrors() {
    this._errs.length = 0;
  }

  /**
   * Adds a validation rule
   * @param rule The validation rule
   */
  protected addRule(rule: SchemaRule<T>, type: string) {
    this._rules.push(ruleArg => {
      if (rule(ruleArg)) return true;

      this.addError(ruleArg.rawValue, `${this._type}.${type}`);

      return false;
    });
  }

  /**
   * Validates a value
   * @param value The value to validate
   * @param options The options for the validator
   * @param message The created message
   */
  public validate(value: unknown, options: ValidatorOptions = {}): ValidationResults<T> {
    const { shouldAbortEarly = true, message, path, parent } = options;
    const isCommandArguments = message != null;

    if (path != null) this._path = path;

    const simpleErr = [this.createError(value)];

    this.clearErrors();

    if (value == null) {
      if (this._isOptional) {
        if (path != null && parent != null) {
          const lastSegment = path.split('.').pop()!;

          (parent as ReferenceableObject)[lastSegment] = this._default;
        }

        return { value: this._default, errors: [], pass: true };
      }

      return { value: null, errors: simpleErr, pass: false };
    }

    let actualValue: T;

    // If we are not validating command arguments, we check the base type
    if (!isCommandArguments) {
      if (!this.check(value)) return { value: null, errors: simpleErr, pass: false };

      actualValue = value;
    } else {
      // Otherwise we check the coerced value
      // this.coerce will always be available for primitive types
      const coerce = this.coerce!(value as string);

      if (coerce == null) return { value: null, errors: simpleErr, pass: false };

      actualValue = coerce;
    }

    for (const rule of this._rules) {
      const result = rule({ value: actualValue, rawValue: value, message });

      if (!result && shouldAbortEarly) return { value: null, errors: this._errs, pass: false };
    }

    if (this._errs.length > 0) return { value: null, errors: this._errs, pass: false };

    return { value: actualValue, errors: [], pass: true };
  }
}
