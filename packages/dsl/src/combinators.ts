import {
  ErrorPath,
  ObjectModel,
  ValidationDescriptor,
  ValidationError,
  Validator,
  ValidatorFactory,
  Validity,
  cast,
  invalid,
  valid,
  validate
} from "@cross-check/core";
import { Task } from "no-show";
import { FIXME } from "./utils";

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
export function chain<T, U extends T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<Validity<T, U>> => {
    return new Task(async run => {
      for (let descriptor of descriptors) {
        let validity = await run(
          validate(value, descriptor as FIXME<any>, context, objectModel)
        );
        if (validity.valid === false) return validity as Validity<T, U>;
      }

      return valid(value as U);
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
export function and<T, U extends T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value, context): Task<Validity<T, U>> => {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let descriptor of descriptors) {
        mergeErrors(
          errors,
          await run(
            validate(value, descriptor as FIXME<any>, context, objectModel)
          )
        );
      }

      if (errors.length === 0) {
        return valid(value as U);
      } else {
        return invalid(value, errors);
      }
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
export function or<T, U extends T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T, U> {
  return (value, context) => {
    return new Task(async run => {
      let result: ValidationError[][] = [];

      for (let descriptor of descriptors) {
        let validity = await run(
          validate(value, descriptor as FIXME<any>, context, objectModel)
        );

        if (validity.valid === true) {
          return validity;
        } else {
          result.push(validity.errors);
        }
      }

      return invalid(value, [
        { path: [], message: { name: "multiple", details: result } }
      ]);
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
export function ifValid<T, U extends T>(
  descriptors: ValidationDescriptors<T>,
  objectModel: ObjectModel
): Validator<T, U> {
  return (value, context) => {
    return new Task(async run => {
      let head = descriptors.slice(0, -1);
      let tail = descriptors.slice(-1)[0];

      for (let descriptor of head) {
        let validity = await run(
          validate(value, descriptor as FIXME<any>, context, objectModel)
        );

        if (validity.valid === true) {
          continue;
        } else {
          return valid(value as U);
        }
      }

      return (await run(
        validate(value, tail as FIXME<any>, context, objectModel)
      )) as FIXME<Validity<T, U>>;
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

export function mapError<T, U extends T>(
  options: MapErrorOptions<T>,
  objectModel: ObjectModel
): Validator<T, U> {
  return (value, context) => {
    return new Task(async run => {
      let validity = await run(
        validate(value, options.do as FIXME<any>, context, objectModel)
      );

      if (validity.valid === false) {
        return cast(value, options.catch(validity.errors));
      } else {
        return validity;
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

function mergeErrors<T, U extends T>(
  base: ValidationError[],
  additions: Validity<T, U>
): void {
  if (additions.valid === true) return;

  additions.errors.forEach(addition => {
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
