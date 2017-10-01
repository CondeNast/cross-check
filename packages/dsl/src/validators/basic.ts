import { Environment, ValidationError } from '@validations/core';
import { Task } from 'no-show';
import { Option } from 'ts-std';
import { ValidatorInstance } from './abstract';

export abstract class BasicValidator<T, Options = void> implements ValidatorInstance<T> {
  constructor(protected env: Environment, protected options: Options) {}

  abstract validate(value: T, context: Option<string>): ValidationError[] | PromiseLike<ValidationError[]>;

  run(value: T, context: Option<string>): Task<ValidationError[]> {
    return new Task(async run => run(this.validate(value, context)));
  }
}
