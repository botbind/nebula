export default class ValidationError extends TypeError {
  public readonly name: string;
  public readonly type: string;

  constructor(value: any, type: string) {
    super(`value "${value}" doesn't have type of ${type}`);

    this.name = 'ValidationError';
    this.type = type;
  }
}
