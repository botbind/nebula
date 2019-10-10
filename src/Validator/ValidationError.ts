import NebulaError from '../NebulaError';

export default class ValidationError extends NebulaError {
  readonly type: string;

  constructor(value: string, key: string, type: string) {
    super(`${key} of "${value}" doesn't have type of ${type}`);

    this.type = type;
  }
}
