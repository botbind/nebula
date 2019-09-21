export default class ValidationError extends TypeError {
  public readonly name: string;
  public readonly type: string;

  constructor(message: string, type: string) {
    super(message);

    this.name = 'ValidationError';
    this.type = type;
  }
}
