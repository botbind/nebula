import ValidationError from './ValidationError';
import { Schema, ValidatorOptions, ValidationResults } from '../../types';

export default class BaseValidator<
  T extends number | boolean | string = number | boolean | string
> {
  public type: string;
  public schema: Schema;
  public errs: ValidationError[];

  constructor(type: string) {
    this.type = type;
    this.schema = {
      type,
      flags: {},
      rules: [],
    };
    this.errs = [];
  }

  public validate(value: string | undefined, options: ValidatorOptions): ValidationResults {
    this.errs = [];

    let returnValue: string | T | null | undefined = value;

    if (value) {
      for (const rule of this.schema.rules) {
        const results = rule(value);

        if (options.abortEarly && !results) break;
      }

      if (options.coerce && this.coerce) {
        returnValue = this.coerce(value);
      }
    } else if (this.schema.flags.required) {
      this.errs.push(new ValidationError(undefined, this.type));

      if (options.coerce) returnValue = null;
    }

    return [this.errs.length ? this.errs : null, returnValue];
  }

  public require() {
    this.schema.flags.required = true;

    return this;
  }

  public coerce?(value: string): T | null;
}
