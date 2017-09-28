import { Environment, ErrorPath, ValidationDescriptor, ValidationError, Validator, ValidatorFactory, validate } from '@validations/core';
import { Task } from 'no-show';

export type ValidationDescriptors<T> = ReadonlyArray<ValidationDescriptor<T>>;
export type CombinatorFactory<T> = ValidatorFactory<T, ValidationDescriptors<T>>;

export function chain<T>(env: Environment, descriptors: ValidationDescriptors<T>): Validator<T> {
  return ((value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      for (let descriptor of descriptors) {
        let errors = await run(validate(env, value, descriptor, context));
        if (errors.length) return errors;
      }

      return [];
    });
  });
}

export function and<T>(env: Environment, descriptors: ValidationDescriptors<T>): Validator<T> {
  return ((value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let result: ValidationError[] = [];

      for (let descriptor of descriptors) {
        let errors = await run(validate(env, value, descriptor, context));
        result.push(...errors);
      }

      return result;
    });
  });
}

export function or<T>(env: Environment, descriptors: ValidationDescriptors<T>): Validator<T> {
  return ((value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let result: ValidationError[][] = [];

      for (let descriptor of descriptors) {
        let errors = await run(validate(env, value, descriptor, context));

        if (errors.length === 0) {
          return [];
        } else {
          result.push(errors);
        }
      }

      return [{ path: [], message: { key: 'multiple', args: result } }];
    });
  });
}

export type MapErrorTransform = (errors: ValidationError[]) => ValidationError[];

export interface MapErrorOptions<T> {
  descriptor: ValidationDescriptor<T>;
  transform: MapErrorTransform;
}

export function mapError<T>(env: Environment, options: MapErrorOptions<T>): Validator<T> {
  return ((value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let { descriptor, transform } = options;
      let errors = await run(validate(env, value, descriptor, context));

      if (errors.length) {
        return transform(errors);
      } else {
        return errors;
      }
    });
  });
}

export function muteAll(): MapErrorTransform {
  return () => [];
}

export function muteType(type: string): MapErrorTransform {
  return errors => errors.filter(error => error.message.key !== type);
}

export function mutePath(path: ErrorPath, exact = false): MapErrorTransform {
  return errors => errors.filter(error => !matchPath(path, error.path, exact));
}

function matchPath(expected: ErrorPath, actual: ErrorPath, exact = false) {
  if (exact && (expected.length === actual.length) || !exact && (expected.length <= actual.length)) {
    return expected.every((part, i) => part === actual[i]);
  } else {
    return false;
  }
}
