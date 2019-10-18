import BaseValidator from './BaseValidator';
import Util from './Util';
import NebulaError from './NebulaError';

type CompareDirections = 'greater' | 'smaller' | 'equal' | 'greaterOrEqual' | 'smallerOrEqual';

const compareDirections = ['greater', 'smaller', 'equal', 'greaterOrEqual', 'smallerOrEqual'];

export default class NumberValidator extends BaseValidator<number> {
  /**
   * Number validator
   */
  constructor() {
    super('number');
  }

  public coerce(value: string) {
    if (Util.isNumber(value)) return Number(value);

    return null;
  }

  /**
   * Check if a value is an integer
   */
  public integer() {
    this.rules.push(({ value, rawValue, key }) => {
      if (Number.isInteger(value)) return true;

      this.addError(rawValue, key, 'number.integer');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is greater than a minimum value
   * @param number The minimum value
   */
  public min(number: number) {
    if (!Util.isNumber(number))
      throw new NebulaError('The minimum value for number.min must be a number');

    this.rules.push(({ value, rawValue, key }) => {
      if (value >= number) return true;

      this.addError(rawValue, key, 'number.min');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is smaller than a maximum value
   * @param number The maximum value
   */
  public max(number: number) {
    if (!Util.isNumber(number))
      throw new NebulaError('The maximum value for number.max must be a number');

    this.rules.push(({ value, rawValue, key }) => {
      if (value <= number) return true;

      this.addError(rawValue, key, 'number.max');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is a multiple of a number
   * @param number The number to check against
   */
  public multiple(number: number) {
    if (!Util.isNumber(number))
      throw new NebulaError('The multiple value for number.multiple must be a number');

    this.rules.push(({ value, rawValue, key }) => {
      if (value % number === 0) return true;

      this.addError(rawValue, key, 'number.multiple');

      return false;
    });

    return this;
  }

  /**
   * Check if a value divides a number
   * @param number The number to check against
   */
  public divide(number: number) {
    if (!Util.isNumber(number))
      throw new NebulaError('The divide value for number.divide must be a number');

    this.rules.push(({ value, rawValue, key }) => {
      if (number % value === 0) return true;

      this.addError(rawValue, key, 'number.divide');

      return false;
    });

    return this;
  }

  /**
   * Compare a value is greater with another value inside the schema
   * @param refKey The reference key
   */
  public compare(refKey: string, direction: CompareDirections) {
    if (typeof refKey !== 'string')
      throw new NebulaError('The reference key for number.compare must be a string');
    if (!compareDirections.includes(direction))
      throw new NebulaError(
        'The direction of compare for number.compare must be greater, smaller, greater or equal, smaler or equal or equal',
      );

    this.rules.push(({ value, rawValue, key, ref }) => {
      const entry = ref(refKey);
      if (entry == null)
        throw new NebulaError(`The reference key for number.compare "${refKey}" not found`);

      const { value: value2, type } = entry;

      if (type !== 'number') {
        this.addError(rawValue, key, `number.compare.${direction}`);

        return false;
      }

      let condition = false;

      switch (direction) {
        case 'greater':
          condition = value > value2;
          break;
        case 'smaller':
          condition = value < value2;
          break;
        case 'equal':
          condition = value === value2;
          break;
        case 'greaterOrEqual':
          condition = value >= value2;
          break;
        case 'smallerOrEqual':
          condition = value <= value2;
          break;
        default:
      }

      if (condition) return true;

      this.addError(rawValue, key, `number.compare.${direction}`);

      return false;
    });

    return this;
  }
}
