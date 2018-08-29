import {
  ErrorPath,
  ObjectModel,
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

/**
 * Run a list of descriptors, one at a time. Report the first failure, and
 * done't execute the remaining descriptors.
 *
 * @param descriptors
 * @param objectModel
 */
export function chain<T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      for (let descriptor of descriptors) {
        let errors = await run(
          validate(value, descriptor, context, objectModel)
        );
        if (errors.length) return errors;
      }

      return [];
    });
  };
}

/**
 * Run a list of descriptors, one at a time. Report a list of all of the
 * failures, merged together. Dedupe identical errors.
 *
 * @param descriptors
 * @param objectModel
 */
export function and<T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let result: ValidationError[] = [];

      for (let descriptor of descriptors) {
        mergeErrors(
          result,
          await run(validate(value, descriptor, context, objectModel))
        );
      }

      return result;
    });
  };
}

/**
 * Run a list of descriptors, one at a time. If any of the validations fail,
 * report a "multiple" error containing a list of error lists, one for each
 * validation failure.
 *
 * @param descriptors
 * @param objectModel
 */
export function or<T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let result: ValidationError[][] = [];

      for (let descriptor of descriptors) {
        let errors = await run(
          validate(value, descriptor, context, objectModel)
        );

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

/**
 * Run a list of descriptors, one at a time. If any but the final descriptor
 * fails, report no error.
 *
 * Otherwise, run the final descriptor and report its errors.
 *
 * This is useful when the head descriptors represent conditions that, when
 * present, render future descriptors irrelevant (for example, if a feature
 * flag is disabled, the remaining validations aren't important).
 *
 * @param descriptors
 * @param objectModel
 */
export function ifValid<T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let head = descriptors.slice(0, -1);
      let tail = descriptors.slice(-1)[0];

      for (let descriptor of head) {
        let errors = await run(
          validate(value, descriptor, context, objectModel)
        );

        if (errors.length === 0) {
          continue;
        } else {
          return [];
        }
      }

      return run(validate(value, tail, context, objectModel));
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
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<ValidationError[]> => {
    return new Task(async run => {
      let errors = await run(validate(value, options.do, context, objectModel));

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
