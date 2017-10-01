import { Environment, ValidationError } from '@validations/core';
import { Task } from 'no-show';
import { Option } from 'ts-std';
import { ValidatorInstance } from './abstract';
import { ValidationResult } from './callback';

export abstract class ValueValidator<T, Options = void> implements ValidatorInstance<T> {
  constructor(protected env: Environment, protected options: Options) {}

  abstract validate(value: T, context: Option<string>): ValidationResult | PromiseLike<ValidationResult>;

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
