import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  Validity,
  invalid,
  valid
} from "@cross-check/core";
import { Task } from "no-show";
import { Option } from "ts-std";
import { BUILD } from "../builders";
import { ValidatorInstance } from "./abstract";
import { ValidationResult } from "./callback";

/**
 * @api public
 *
 * A validator superclass for validating a single value.
 *
 * Subclasses should implement `validate()`, and the class will, by default,
 * wrap any results returned by `validate()` in an error with an empty path.
 *
 * If you need to return multiple errors from `validate()`, use the primitive
 * `BasicValidator` superclass instead.
 */
export abstract class ValueValidator<T, U extends T, Options = void>
  implements ValidatorInstance<T, U> {
  constructor(protected env: Environment, protected options: Options) {}

  abstract validate(
    value: T,
    context: Option<string>
  ): ValidationResult | PromiseLike<ValidationResult>;

  run(value: T, context: Option<string>): Task<Validity<T, U>> {
    return new Task(async run => {
      let message = await run(this.validate(value, context));

      if (message) {
        return invalid(value, [{ path: [], message }]);
      } else {
        return valid(value as U);
      }
    });
  }
}

export abstract class SimpleValueValidator<
  T,
  U extends T
> extends ValueValidator<T, U, void> {
  static get validatorName() {
    return this.name;
  }

  static [BUILD]<T, U extends T>(): ValidationDescriptor<T> {
    let Class = (this as any) as {
      new (env: Environment, options: unknown): SimpleValueValidator<T, U>;
    };

    return {
      name: this.validatorName,
      validator: (options: unknown, env: Environment) => (value: T) =>
        new Class(env, options).run(value, null),
      options: undefined
    };
  }
}
