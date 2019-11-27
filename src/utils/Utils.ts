/**
 * Nebula utility functions
 */
class Utils {
  // https://github.com/Microsoft/TypeScript/issues/21826
  // https://github.com/Microsoft/TypeScript/issues/26010

  /**
   * Returns an array of key/values of the enumerable properties of an object
   * @param obj The object that contains the properties and methods
   */
  public static entriesOf<T>(obj: T) {
    return Object.entries(obj) as [Extract<keyof T, string>, T[keyof T]][];
  }

  public static keysOf<T>(obj: T) {
    return Object.keys(obj) as Extract<keyof T, string>[];
  }
}

export default Utils;
