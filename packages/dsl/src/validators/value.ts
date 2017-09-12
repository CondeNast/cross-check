import { Environment, ErrorMessage, ValidationError } from '@validations/core';
import { Task } from 'no-show';

export type ValidationResult = ErrorMessage | void;

export abstract class ValueValidator<T, Options> {
  constructor(protected env: Environment, protected options: Options) {}

  abstract validate(value: T): ValidationResult | PromiseLike<ValidationResult>;

  run(v: T): Task<ValidationError[]> {
    return new Task(async run => {
      let message = await run(this.validate(v));

      if (message) {
        return [{ path: [], message }];
      } else {
        return [];
      }
    });
  }
}
