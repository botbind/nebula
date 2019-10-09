import BaseValidator from './BaseValidator';
import Util from '../Util';

type CompareDirections = 'greater' | 'smaller' | 'equal' | 'greaterOrEqual' | 'smallerOrEqual';

const compareDirections = ['greater', 'smaller', 'equal', 'greaterOrEqual', 'smallerOrEqual'];

export default class NumberValidator extends BaseValidator<number> {
  /**
   * Number validator
   */
  constructor() {
    super('number');
  }

  coerce(value: any) {
    if (Util.isNumber(value)) return Number(value);

    return null;
  }

  /**
   * Check if a value is an integer
   */
  integer() {
    this.rules.push(({ value, rawValue, key }) => {
      if (Number.isInteger(value)) return true;

      this.addError(rawValue, key, 'number.integer');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is in range
   * @param min The min value
   * @param max The max value
   */
  range(min?: number, max?: number) {
    if (!Util.isNumber(min)) throw new TypeError('min must be a number');
    if (!Util.isNumber(max)) throw new TypeError('max must be a number');

    this.rules.push(({ value, rawValue, key }) => {
      if ((!min || value >= min) && (!max || value <= max)) return true;

      this.addError(rawValue, key, 'number.range');

      return false;
    });

    return this;
  }

  /**
   * Check if a value is a multiple of a number
   * @param number The number to check against
   */
  multiple(number: number) {
    if (!Util.isNumber(number)) throw new TypeError('number must be a number');

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
  divide(number: number) {
    if (!Util.isNumber(number)) throw new TypeError('number must be a number');

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
  compare(refKey: string, direction: CompareDirections) {
    if (typeof refKey !== 'string') throw new TypeError('refKey must be a string');
    if (!compareDirections.includes(direction))
      throw new TypeError('direction must be greater, smaller or equal');

    this.rules.push(({ value, rawValue, key, ref }) => {
      const entry = ref(refKey);

      if (!entry) throw new TypeError(`refKey "${refKey}" not found`);

      const { value: value2, type } = entry;

      if (type !== 'number') {
        this.addError(rawValue, key, `number.compare.${direction}`);

        return false;
      }

      let condition = false;

      if (direction === 'greater') condition = value > value2;
      if (direction === 'smaller') condition = value < value2;
      if (direction === 'equal') condition = value === value2;
      if (direction === 'greaterOrEqual') condition = value >= value2;
      if (direction === 'smallerOrEqual') condition = value <= value2;

      if (condition) return true;

      this.addError(rawValue, key, `number.compare.${direction}`);

      return false;
    });

    return this;
  }
}
