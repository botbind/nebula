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
    let failedRequired = false;

    if (value) {
      for (const rule of this.schema.rules) {
        const args = rule.args != null ? rule.args : undefined;
        const results = rule.method(value, args);

        if (options.abortEarly && !results) break;
      }
    } else if (this.schema.flags.required) {
      this.errs.push(new ValidationError(value, this.type));

      failedRequired = true;
    }

    if (options.coerce) {
      if (failedRequired) returnValue = null;
      else if (this.coerce && value) returnValue = this.coerce(value);
    }

    return [this.errs.length ? this.errs : null, returnValue];
  }

  public require() {
    this.schema.flags.required = true;

    return this;
  }

  public coerce?(value: string): T | null;
}
