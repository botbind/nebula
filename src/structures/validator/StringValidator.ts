import BaseValidator from './BaseValidator';

export default class StringValidator extends BaseValidator<string> {
  constructor() {
    super('string');
  }
}
