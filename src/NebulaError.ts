export default class NebulaError extends Error {
  public name: string;

  constructor(message: string) {
    super(message);

    this.name = 'NebulaError';
  }
}
