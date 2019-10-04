export default class ValidationError extends TypeError {
  readonly name: string;
  readonly type: string;

  constructor(value: string, key: string, type: string) {
    super(`${key} of "${value}" doesn't have type of ${type}`);

    this.name = 'ValidationError';
    this.type = type;
  }
}
