import { Environment, ValidationDescriptor, ValidationError, validate } from '@validations/core';
import normalize, { ValidationBuilder, validates } from '@validations/dsl';
import { Task } from 'no-show';
import { Option, unknown } from 'ts-std';
import { ValidatorInstance, factoryFor } from './abstract';
import { isArray } from './is';

function mapError({ path, message }: ValidationError, index: number): ValidationError {
  return { path: [...path, String(index)], message };
}

export class ItemsValidator implements ValidatorInstance<unknown[]> {
  constructor(protected env: Environment, protected descriptor: ValidationDescriptor) {}

  run(value: unknown[], context: Option<string>): Task<ValidationError[]> {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let i = 0; i < value.length; i++) {
        let suberrors = await run(validate(this.env, value[i], this.descriptor, context));
        errors.push(...suberrors.map(error => mapError(error, i)));
      }

      return errors;
    });
  }
}

export function items<T>(builder: ValidationBuilder<T>): ValidationBuilder<T[]> {
  return validates(factoryFor(ItemsValidator), normalize(builder));
}

export function array(builder: ValidationBuilder<unknown>): ValidationBuilder<unknown> {
  return isArray().andThen(items(builder));
}
