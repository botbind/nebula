import NebulaError from './NebulaError';

export default class ValidationError extends NebulaError {
  /**
   * The type of the validator
   */
  public type: string;

  constructor(value: string, key: string, type: string) {
    super(`${key} of "${value}" doesn't have type of ${type}`);

    this.type = type;
  }
}
