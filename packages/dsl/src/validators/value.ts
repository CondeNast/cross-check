import { Environment, ValidationError } from '@cross-check/core';
import { Task } from 'no-show';
import { Option } from 'ts-std';
import { ValidatorInstance } from './abstract';
import { ValidationResult } from './callback';

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
