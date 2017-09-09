import { Environment, ValidationDescriptors, ValidationError, Validator } from '@validations/core';
import { Task } from 'no-show';
import { unknown } from 'ts-std';

export function chain(env: Environment, options: ValidationDescriptors): Validator {
  let validators = options.map(desc => desc.factory(env, desc.options));

  return ((value: unknown): Task<ValidationError[]> => {
    return new Task(async run => {
      for (let validator of validators) {
        let errors = await run(validator(value));
        if (errors.length) return errors;
      }

      return [];
    });
  });
}

export function and(env: Environment, options: ValidationDescriptors): Validator {
  let validators = options.map(desc => desc.factory(env, desc.options));

  return ((value: unknown): Task<ValidationError[]> => {
    let out: ValidationError[] = [];

    return new Task(async run => {
      for (let validator of validators) {
        let errors = await run(validator(value));
        out.push(...errors);
      }

      return out;
    });
  });
}
