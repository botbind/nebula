export default class NebulaError extends Error {
  public name: string;

  /**
   * Represents an error that originates from Nebula
   * @param message The message of the error
   */
  constructor(message: string) {
    super(message);

    this.name = 'NebulaError';
  }
}
