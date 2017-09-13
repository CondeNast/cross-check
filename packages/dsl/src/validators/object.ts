import { Environment, ValidationDescriptor, ValidationError, validate } from '@validations/core';
import normalize, { ValidationBuilder, validates } from '@validations/dsl';
import { Task } from 'no-show';
import { Dict, Indexable, dict, entries, unknown } from 'ts-std';
import { ValidatorInstance, factoryFor } from './abstract';
import { isObject } from './is';

function mapError({ path, message }: ValidationError, key: string): ValidationError {
  return { path: [...path, key], message };
}

export class FieldsValidator implements ValidatorInstance<Indexable> {
  constructor(protected env: Environment, protected descriptors: Dict<ValidationDescriptor>) {}

  run(v: Indexable): Task<ValidationError[]> {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let [key, descriptor] of entries(this.descriptors)) {
        let suberrors = await run(validate(this.env, this.env.get(v, key), descriptor!));
        errors.push(...suberrors.map(error => mapError(error, key)));
      }

      return errors;
    });
  }
}

export function fields<T>(builders: Dict<ValidationBuilder<T>>): ValidationBuilder<Indexable<T>> {
  return validates(factoryFor(FieldsValidator), normalizeFields(builders));
}

export function object(builders: Dict<ValidationBuilder<unknown>>): ValidationBuilder<unknown> {
  return isObject().andThen(fields(builders));
}

function normalizeFields(builders: Dict<ValidationBuilder<unknown>>): Dict<ValidationDescriptor> {
  let out = dict<ValidationDescriptor>();

  for (let [key, value] of entries(builders)) {
    out[key] = normalize(value!);
  }

  return out;
}
