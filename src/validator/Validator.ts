import Schema, { SchemaMap, SchemaTypes, ReferenceableValue } from './Schema';
import BooleanSchema from './BooleanSchema';
import NumberSchema from './NumberSchema';
import StringSchema from './StringSchema';
import DateSchema from './DateSchema';
import ArraySchema from './ArraySchema';
import ObjectSchema from './ObjectSchema';
import MiscSchema from './MiscSchema';
import Ref from './Ref';

let value: ReferenceableValue = {};

export default class Validator {
  /**
   * Creates a boolean schema that matches the boolean data type
   */
  public static boolean() {
    return new BooleanSchema();
  }

  /**
   * Creates a number schema that matches the number data type
   */
  public static number() {
    return new NumberSchema();
  }

  /**
   * Creates a string schema that matches the string data type
   */
  public static string() {
    return new StringSchema();
  }

  /**
   * Creates a date schema that matches the Date object
   */
  public static date() {
    return new DateSchema();
  }

  /**
   * Creates an array schema that matches the array data type
   * @param schema The schema for the array items
   */
  public static array<T extends SchemaTypes>(schema?: Schema<T>) {
    return new ArraySchema(schema);
  }

  /**
   * Creates an object schema that matches the object data type
   * @param schemaMap The map of schemas
   */
  public static object<T extends SchemaMap>(schemaMap: T) {
    return new ObjectSchema(schemaMap);
  }

  /**
   * Creates a schema consisting of miscellaneous rules
   */
  public static misc<T extends SchemaTypes>() {
    return new MiscSchema<T>();
  }

  /**
   * Creates a reference to a value from the given path. Only works inside ObjectSchema
   * @param path The path to the value
   */
  public static ref(path: unknown) {
    return new Ref(path);
  }

  public static setValue(newValue: ReferenceableValue) {
    value = newValue;
  }

  public static getValue() {
    return value;
  }
}
