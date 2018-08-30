import {
  ValidationDescriptor,
  ValidationError,
  ValidatorFactory
} from "./index";

import { Task } from "no-show";
import { Option } from "ts-std";
import { KnownValidatorFactory, invalid, valid } from "./descriptor";

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
export function validator<T, U extends T = T>(
  name: string,
  validatorFunction: () => (value: T) => value is U
): () => ValidationDescriptor<T, U>;

export function validator<T, Options, U extends T = T>(
  name: string,
  validatorFunction: (options: Options) => (value: T) => value is U
): (options: Options) => ValidationDescriptor<T, U>;

export function validator<T, Options, U extends T = T>(
  name: string,
  validatorFunction: HigherOrderBasicValidator<T, U, Options>
): (options: Options) => ValidationDescriptor<T, U> {
  return (options: Options) => {
    let f = simpleToFull(name, validatorFunction);

    return {
      name,
      validator: f,
      options
    } as ValidationDescriptor<T, U>;
  };
}

function simpleToFull<T, U extends T, Options>(
  name: string,
  simple: HigherOrderBasicValidator<T, U, Options>
): KnownValidatorFactory<T, U, Options> {
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
      });
    };
  };
}
