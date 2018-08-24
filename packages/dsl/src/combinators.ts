import {
  Environment,
  ErrorPath,
  ValidationDescriptor,
  ValidationError,
  Validator,
  ValidatorFactory,
  Validity,
  invalid,
  valid,
  validate
} from "@cross-check/core";
import { Task } from "no-show";

export class ValidationDescriptors<T, U extends T> {
  private descs: Array<ValidationDescriptor<unknown, unknown, unknown>>;

  constructor(
    descriptor: ValidationDescriptor<T, U> | Array<ValidationDescriptor<T, U>>
  ) {
    if (Array.isArray(descriptor)) {
      this.descs = descriptor as ValidationDescriptor[];
    } else {
      this.descs = [descriptor] as ValidationDescriptor[];
    }
  }

  chain<V extends U>(
    desc: ValidationDescriptor<U, V>
  ): ValidationDescriptors<T, V> {
    this.descs.push(desc as any);
    return this as any;
  }

  union<V extends T>(
    desc: ValidationDescriptor<T, V>
  ): ValidationDescriptors<T, U | V> {
    this.descs.push(desc as any);
    return this as any;
  }

  intersection<V extends T>(
    desc: ValidationDescriptor<T, V>
  ): ValidationDescriptors<T, U & V> {
    this.descs.push(desc as any);
    return this as any;
  }

  toArray(): Array<ValidationDescriptor<unknown, unknown, unknown>> {
    return this.descs;
  }
}

// export type ValidationDescriptors<T, U extends T> = ReadonlyArray<
//   ValidationDescriptor<unknown, unknown>
// >;

export type CombinatorFactory<T, U extends T> = ValidatorFactory<
  T,
  U,
  ValidationDescriptors<T, U>
>;

/**
 * Run a list of descriptors, one at a time. Report the first failure, and
 * done't execute the remaining descriptors.
 *
 * @param descriptors
 * @param env
 */
export function chain<T, U extends T>(
  descriptors: ValidationDescriptors<T, U>,
  env: Environment
): Validator<T, U> {
  return (value, context): Task<Validity<T, U>> => {
    return new Task<Validity<T, U>>(async run => {
      for (let descriptor of descriptors.toArray()) {
        let validity = (await run(
          validate(value, descriptor, context, env)
        )) as Validity<T, U>;
        if (validity.valid === false) return validity;
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
 * @param env
 */
export function and<T, U extends T>(
  descriptors: ValidationDescriptors<T, U>,
  env: Environment
): Validator<T, U> {
  return (value, context): Task<Validity<T, U>> => {
    return new Task(async run => {
      let result: ValidationError[] = [];

      for (let descriptor of descriptors.toArray()) {
        mergeErrors(result, (await run(
          validate(value, descriptor, context, env)
        )) as Validity<T, U>);
      }

      return invalid(value, result);
    });
  };
}

/**
 * Run a list of descriptors, one at a time. If any of the validations fail,
 * report a "multiple" error containing a list of error lists, one for each
 * validation failure.
 *
 * @param descriptors
 * @param env
 */
export function or<T, U extends T>(
  descriptors: ValidationDescriptors<T, U>,
  env: Environment
): Validator<T, U> {
  return (value, context) => {
    return new Task(async run => {
      let result: ValidationError[][] = [];

      for (let descriptor of descriptors.toArray()) {
        let validity = (await run(
          validate(value, descriptor, context, env)
        )) as Validity<T, U>;

        if (validity.valid) {
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
 * @param env
 */
export function ifValid<T, U extends T>(
  descriptors: ValidationDescriptors<T, U>,
  env: Environment
): Validator<T, U> {
  return (value, context): Task<Validity<T, U>> => {
    return new Task(async run => {
      let descs = descriptors.toArray();

      let head = descs.slice(0, -1);
      let tail = descs.slice(-1)[0];

      for (let descriptor of head) {
        let validity = (await run(
          validate(value, descriptor, context, env)
        )) as Validity<T, U>;

        if (validity.valid) {
          continue;
        } else {
          return validity;
        }
      }

      return run(validate(value, tail, context, env)) as Promise<
        Validity<T, U>
      >;
    });
  };
}

export type MapErrorTransform = (
  errors: ValidationError[]
) => ValidationError[];

export interface MapErrorOptions<T, U extends T> {
  do: ValidationDescriptor<T, U, unknown>;
  catch: MapErrorTransform;
}

export type MapError<T, U extends T> = (
  options: MapErrorOptions<T, U>,
  env: Environment
) => Validator<T, U>;

export function mapError<T, U extends T>(
  options: MapErrorOptions<T, U>,
  env: Environment
): Validator<T, U> {
  return (value, context): Task<Validity<T, U>> => {
    return new Task(async run => {
      let validity = (await run(
        validate(value, options.do, context, env)
      )) as Validity<T, U>;

      if (validity.valid === true) {
        return validity;
      } else {
        let errors = options.catch(validity.errors);

        if (errors.length === 0) {
          return valid(value) as Validity<T, U>;
        } else {
          return invalid(value, errors) as Validity<T, U>;
        }
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
  additions: Validity<unknown, unknown>
): void {
  if (additions.valid === true) {
    return;
  }

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
