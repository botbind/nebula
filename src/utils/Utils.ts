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

  /**
   * Returns the names of the enumerable string properties and methods of an object
   * @param obj The object that contains the properties and methods
   */
  public static keysOf<T>(obj: T) {
    return Object.keys(obj) as Extract<keyof T, string>[];
  }

  /**
   * Splits the array items into 2 groups, the first of which contains elements predicate returns truthy for, the second of which contains elements predicate returns falsy for
   * @param array The array to split
   * @param predicate The predicate invoked per iteration
   */
  public static partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const falsy: T[] = [];

    const truthy = array.filter(item => {
      if (!predicate(item)) {
        falsy.push(item);

        return false;
      }

      return true;
    });

    return [truthy, falsy];
  }
}

export default Utils;
