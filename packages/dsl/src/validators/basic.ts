import { ObjectModel, ValidationError } from "@cross-check/core";
import { Task } from "no-show";
import { ValidatorInstance } from "./abstract";

/**
 * @api primitive
 *
 * The most basic, primitive Validator superclass for validating a single value.
 *
 * Subclasses should implement `validate()` and can return an array of validation
 * errors. If you only need to return a single error, use `ValueValidator`
 * instead.
 */
export abstract class BasicValidator<T, Options = void>
  implements ValidatorInstance<T> {
  constructor(protected objectModel: ObjectModel, protected options: Options) { }

  get env(): ObjectModel {
    return this.objectModel;
  }

  abstract validate(
    value: T,
    context: string | null
  ): ValidationError[] | PromiseLike<ValidationError[]>;

  run(value: T, context: string | null): Task<ValidationError[]> {
    return new Task(async run => run(this.validate(value, context)));
  }
}
