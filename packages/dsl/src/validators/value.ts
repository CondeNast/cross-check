import { ObjectModel, Task, ValidationError } from "@condenast/cross-check";
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
  constructor(protected objectModel: ObjectModel, protected options: Options) {}

  get env(): ObjectModel {
    return this.objectModel;
  }

  abstract validate(
    value: T,
    context: string | null
  ): ValidationResult | PromiseLike<ValidationResult>;

  run(value: T, context: string | null): Task<ValidationError[]> {
    return new Task(async (run) => {
      const message = await run(this.validate(value, context));

      if (message) {
        return [{ path: [], message, level: "error" }];
      } else {
        return [];
      }
    });
  }
}
