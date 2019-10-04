import BaseValidator from './BaseValidator';

export default class StringValidator extends BaseValidator<string> {
  /**
   * String validator
   */
  constructor() {
    super('string');
  }

  coerce(value: string) {
    return value;
  }
}
