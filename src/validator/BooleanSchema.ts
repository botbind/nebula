import Schema from './Schema';

export default class BooleanSchema extends Schema<boolean> {
  /**
   * The schema that represents the boolean data type
   * ```ts
   * const schema = Validator.boolean().validate(true);
   *
   * // Pass
   * const result = schema.validate(true);
   *
   * // Fail
   * const result = schema.validate('a');
   * const result = schema.validate(1);
   * const result = schema.validate(new Date());
   * const result = schema.validate([]);
   * const result = schema.validate({});
   * ```
   * Error type: `boolean`
   */
  constructor() {
    super('boolean');
  }

  protected check(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  protected coerce(value: string) {
    if (['true', '1', '+', 'on', 'enable', 'enabled', 't', 'yes', 'y'].includes(value)) return true;
    if (['false', '0', '-', 'off', 'disable', 'disabled', 'f', 'no', 'n'].includes(value))
      return false;

    return null;
  }

  /**
   * Specifies that a boolean must be truthy
   * ```ts
   * const schema = Validator.boolean().truthy();
   * ```
   * Error type(s): `boolean.truthy`
   */
  public truthy() {
    this.addRule(({ value }) => value, 'truthy');

    return this;
  }

  /**
   * Specifies that a boolean must be falsy
   * ```ts
   * const schema = Validator.boolean().falsy();
   * ```
   * Error type(s): `boolean.falsy`
   */
  public falsy() {
    this.addRule(({ value }) => !value, 'truthy');

    return this;
  }
}
