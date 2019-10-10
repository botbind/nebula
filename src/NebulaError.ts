export default class NebulaError extends Error {
  readonly name: string;

  constructor(message: string) {
    super(message);

    this.name = 'NebulaError';
  }
}
