import {
  Environment,
  ErrorPath,
  ValidationDescriptor,
  ValidationError,
  Validator,
  ValidatorFactory,
  validate
} from "@cross-check/core";
import { Task } from "no-show";

export type ValidationDescriptors<T> = ReadonlyArray<ValidationDescriptor<T>>;
export type CombinatorFactory<T> = ValidatorFactory<
  T,
  ValidationDescriptors<T>
>;

export function chain<T>(
  descriptors: ValidationDescriptors<T>,
  env: Environment
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      for (let descriptor of descriptors) {
        let errors = await run(validate(value, descriptor, context, env));
        if (errors.length) return errors;
      }

      return [];
    });
  };
}

export function and<T>(
  descriptors: ValidationDescriptors<T>,
  env: Environment
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let result: ValidationError[] = [];

      for (let descriptor of descriptors) {
        mergeErrors(
          result,
          await run(validate(value, descriptor, context, env))
        );
      }

      return result;
    });
  };
}

export function or<T>(
  descriptors: ValidationDescriptors<T>,
  env: Environment
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let result: ValidationError[][] = [];

      for (let descriptor of descriptors) {
        let errors = await run(validate(value, descriptor, context, env));

        if (errors.length === 0) {
          return [];
        } else {
          result.push(errors);
        }
      }

      return [{ path: [], message: { name: "multiple", details: result } }];
    });
  };
}

export type MapErrorTransform = (
  errors: ValidationError[]
) => ValidationError[];

export interface MapErrorOptions<T> {
  do: ValidationDescriptor<T>;
  catch: MapErrorTransform;
}

export function mapError<T>(
  options: MapErrorOptions<T>,
  env: Environment
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let errors = await run(validate(value, options.do, context, env));

      if (errors.length) {
        return options.catch(errors);
      } else {
        return errors;
      }
    });
  };
}

export function muteAll(): MapErrorTransform {
  return () => [];
}

export function muteType(type: string): MapErrorTransform {
  return errors => errors.filter(error => error.message.name !== type);
}

export function mutePath(path: ErrorPath, exact = false): MapErrorTransform {
  return errors => errors.filter(error => !matchPath(path, error.path, exact));
}

function mergeErrors(
  base: ValidationError[],
  additions: ValidationError[]
): void {
  additions.forEach(addition => {
    if (base.every(error => !matchError(error, addition))) {
      base.push(addition);
    }
  });
}

function matchError(a: ValidationError, b: ValidationError): boolean {
  return matchPath(a.path, b.path, true) && a.message.name === b.message.name;
}

function matchPath(
  expected: ErrorPath,
  actual: ErrorPath,
  exact = false
): boolean {
  if (
    (exact && expected.length === actual.length) ||
    (!exact && expected.length <= actual.length)
  ) {
    return expected.every((part, i) => part === actual[i]);
  } else {
    return false;
  }
}
