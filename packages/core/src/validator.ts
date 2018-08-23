import { ValidationDescriptor, ValidatorFactory } from "./descriptor";
import { ValidationError, Validity, invalid, valid } from "./validity";

import { Task } from "no-show";
import { Option } from "ts-std";

export type BasicValidator<T> = (value: T) => ValidationError[] | void;

export type HigherOrderBasicValidator<T, U extends T, Options> = ((
  options?: Options
) => (value: T) => value is U);

/**
 * @api primitive
 *
 * A function that takes a synchronous, basic validator factory and produces
 * a validator descriptor.
 *
 * @param name
 * @param validatorFunction
 */
export function validator<T, U extends T>(
  name: string,
  validatorFunction: () => (value: T) => value is U
): () => ValidationDescriptor<T, U, unknown>;

export function validator<T, U extends T, Options>(
  name: string,
  validatorFunction: (options: Options) => (value: T) => value is U
): (options: Options) => ValidationDescriptor<T, U, unknown>;

export function validator<T, U extends T, Options>(
  name: string,
  validatorFunction: HigherOrderBasicValidator<T, U, Options>
): (options?: Options) => ValidationDescriptor<T, U, Options> {
  return (options?: Options) => {
    return {
      name,
      validator: simpleToFull(name, validatorFunction),
      options: options as Options
    };
  };
}

function simpleToFull<T, U extends T, Options>(
  name: string,
  simple: HigherOrderBasicValidator<T, U, Options>
): ValidatorFactory<T, U, Options> {
  return (options: Options) => {
    let validate = simple(options);
    let details = options === undefined ? null : options;

    return (value: T, _context: Option<string>) => {
      return new Task(async () => {
        if (!validate(value)) {
          return invalid(value, [{ path: [], message: { name, details } }]);
        } else {
          return valid(value as U);
        }
      }) as Task<Validity<T, U>>;
    };
  };
}
