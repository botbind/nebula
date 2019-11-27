import NebulaError from './NebulaError';

export default class ValidationError extends NebulaError {
  /**
   * The type of the schema or rule that generates the error
   */
  public type: string;

  /**
   * Represents an error that is created whenever a schema fails to validate.
   * @param value The value to validate
   * @param type The type of the schema or rule that generates the error
   * @param label The label of the schema
   */
  constructor(value: unknown, type: string, label: string | null) {
    super(`${label} of ${JSON.stringify(value)} doesn't have type of ${type}`);

    this.type = type;
  }
}
