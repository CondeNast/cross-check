import { Environment, ValidationError } from '@cross-check/core';
import { Task } from 'no-show';
import { Option } from 'ts-std';
import { ValidatorInstance } from './abstract';

/**
 * @api primitive
 *
 * The most basic, primitive Validator superclass for validating a single value.
 *
 * Subclasses should implement `validate()` and can return an array of validation
 * errors. If you only need to return a single error, use `ValueValidator`
 * instead.
 */
export abstract class BasicValidator<T, Options = void> implements ValidatorInstance<T> {
  constructor(protected env: Environment, protected options: Options) {}

  abstract validate(value: T, context: Option<string>): ValidationError[] | PromiseLike<ValidationError[]>;

  run(value: T, context: Option<string>): Task<ValidationError[]> {
    return new Task(async run => run(this.validate(value, context)));
  }
}
