import {
  Environment,
  ValidationDescriptor,
  ValidationError
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
export abstract class ValueValidator<T, Options = void>
  implements ValidatorInstance<T> {
  constructor(protected env: Environment, protected options: Options) {}

  abstract validate(
    value: T,
    context: Option<string>
  ): ValidationResult | PromiseLike<ValidationResult>;

  run(value: T, context: Option<string>): Task<ValidationError[]> {
    return new Task(async run => {
      let message = await run(this.validate(value, context));

      if (message) {
        return [{ path: [], message }];
      } else {
        return [];
      }
    });
  }
}

export abstract class SimpleValueValidator<T> extends ValueValidator<T, void> {
  static get validatorName() {
    return this.name;
  }

  static [BUILD]<T>(): ValidationDescriptor<T> {
    let Class = (this as any) as {
      new (env: Environment, options: unknown): SimpleValueValidator<T>;
    };

    return {
      name: this.validatorName,
      validator: (options: unknown, env: Environment) => (value: T) =>
        new Class(env, options).run(value, null),
      options: undefined
    };
  }
}
