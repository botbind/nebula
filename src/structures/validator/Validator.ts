import BooleanValidator from './BooleanValidator';
import NumberValidator from './NumberValidator';
import StringValidator from './StringValidator';

/*
[{
  name: 'case',
  args: {
    direction: 'upper',
  },
  type: 'string',
}]
*/

export default class Validator {
  public static boolean() {
    return new BooleanValidator();
  }

  public static number() {
    return new NumberValidator();
  }

  public static string() {
    return new StringValidator();
  }
}
