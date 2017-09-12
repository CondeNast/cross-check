import { Environment, ValidationDescriptor, ValidationError, Validator, validate } from '@validations/core';
import { Task } from 'no-show';
import { unknown } from 'ts-std';

export function chain<T>(env: Environment, descriptors: ReadonlyArray<ValidationDescriptor<T>>): Validator<T> {
  return ((value: unknown): Task<ValidationError[]> => {
    return new Task(async run => {
      for (let descriptor of descriptors) {
        let errors = await run(validate(env, value, descriptor));
        if (errors.length) return errors;
      }

      return [];
    });
  });
}

export function and<T>(env: Environment, descriptors: ReadonlyArray<ValidationDescriptor<T>>): Validator<T> {
  return ((value: unknown): Task<ValidationError[]> => {
    let result: ValidationError[] = [];

    return new Task(async run => {
      for (let descriptor of descriptors) {
        let errors = await run(validate(env, value, descriptor));
        result.push(...errors);
      }

      return [];
    });
  });
}
