import { Task } from "./task";
import {
  ValidationDescriptor,
  ValidationError,
  ValidatorFactory,
} from "./index";

export type BasicValidator<T> = (value: T) => ValidationError[] | void;

export type HigherOrderBasicValidator<T, Options> = (
  options?: Options
) => (value: T) => boolean;

/**
 * @api primitive
 *
 * A function that takes a synchronous, basic validator factory and produces
 * a validator descriptor.
 *
 * @param name
 * @param validatorFunction
 */
export function validator<T>(
  name: string,
  validatorFunction: () => (value: T) => boolean
): () => ValidationDescriptor<T, void>;

export function validator<T, Options>(
  name: string,
  validatorFunction: (options: Options) => (value: T) => boolean
): (options: Options) => ValidationDescriptor<T, Options>;

export function validator<T, Options>(
  name: string,
  validatorFunction: HigherOrderBasicValidator<T, Options>
): (options?: Options) => ValidationDescriptor<T, Options> {
  return (options?: Options) => {
    return {
      name,
      validator: simpleToFull(name, validatorFunction),
      options: options as Options,
    };
  };
}

function simpleToFull<T, Options>(
  name: string,
  simple: HigherOrderBasicValidator<T, Options>
): ValidatorFactory<T, Options> {
  return (options: Options) => {
    const validate = simple(options);
    const details = options === undefined ? null : options;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (value: T, _context: string | null) => {
      return new Task(async () => {
        if (!validate(value)) {
          return [{ path: [], message: { name, details }, level: "error" }];
        } else {
          return [];
        }
      });
    };
  };
}
