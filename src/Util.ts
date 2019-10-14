/**
 * Nebula utility functions
 */
class Util {
  /**
   * Check whether a value is a function
   * @param maybeFunction The value to check
   */
  static isFunction(maybeFunction: unknown) {
    return typeof maybeFunction === 'function';
  }

  /**
   * Check whether a value is a plain object
   * @param maybeObject The value to check
   */
  static isObject(maybeObject: unknown) {
    return (
      typeof maybeObject === 'object' &&
      Object.prototype.toString.call(maybeObject) === '[object Object]'
    );
  }

  /**
   * Check whether a value is an array
   * @param maybeArray The value to check
   */
  static isArray(maybeArray: unknown) {
    return Array.isArray(maybeArray);
  }

  /**
   * Check whether a value is a number
   * @param maybeNumber The value to check
   */
  static isNumber(maybeNumber: unknown) {
    const coerce = Number(maybeNumber);

    return !Number.isNaN(coerce);
  }

  // https://github.com/Microsoft/TypeScript/issues/21826
  // https://github.com/Microsoft/TypeScript/issues/26010

  /**
   * Returns an array of key/values of the enumerable properties of an object
   * @param obj The object that contains the properties and methods
   */
  static entriesOf<T>(obj: T) {
    return Object.entries(obj) as [Extract<keyof T, string>, T[keyof T]][];
  }
}

export default Util;
