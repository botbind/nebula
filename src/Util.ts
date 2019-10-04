/**
 * Nebula utility functions
 */
class Util {
  /**
   * Check whether a value is a function
   * @param maybeFunction The value to check
   */
  static isFunction(maybeFunction: any) {
    return typeof maybeFunction === 'function';
  }

  /**
   * Check whether a value is a plain object
   * @param maybeObject The value to check
   */
  static isObject(maybeObject: any) {
    return (
      typeof maybeObject === 'object' &&
      Object.prototype.toString.call(maybeObject) === '[object Object]'
    );
  }

  /**
   * Check whether a value is an array
   * @param maybeArray The value to check
   */
  static isArray(maybeArray: any) {
    return Array.isArray(maybeArray);
  }
}

export default Util;
