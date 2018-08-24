import { Task } from "no-show";
import { Option } from "ts-std";
import { Environment } from "./environment";
import { Validity } from "./validity";

/**
 * @api primitive
 *
 * A function that takes an environment and validator options and produces a new
 * Validator function. In other words, it curries the environment and options.
 */
export type ValidatorFactory<T, U extends T, Options> = (
  options: Options,
  env: Environment
) => Validator<T, U>;

/**
 * @api primitive
 *
 * A function that takes a value and a validation context and (asynchronously)
 * produces a list of validation errors.
 *
 * A successful validation produces an empty list of validation errors.
 *
 * Primitive validations must use no-show Tasks (which can be cancelled) to manage asynchrony.
 */
export type Validator<T = unknown, U extends T = T> = (
  value: T,
  context: Option<string>
) => Task<Validity<T extends any ? unknown : T, U>>;

/**
 * @api primitive
 *
 * A low-level representation of a validation.
 */
export type ValidationDescriptor<
  T = unknown,
  U extends T = T,
  Options = unknown
> = Readonly<{
  name: string;
  validator: ValidatorFactory<T, U, Options>;
  options: Options;
  contexts?: ReadonlyArray<string>;
}>;

export function descriptor<T, U extends T, Options>(
  name: string,
  validator: ValidatorFactory<T, U, Options>,
  options: Options,
  contexts?: ReadonlyArray<string>
): ValidationDescriptor<T, U> {
  return {
    name,
    validator: validator as ValidatorFactory<T, U, unknown>,
    options,
    contexts
  };
}
