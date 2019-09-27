import BaseValidator from './BaseValidator';

export default class NumberValidator extends BaseValidator<number> {
  constructor() {
    super('number');
  }
}
