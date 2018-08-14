import { Task } from "no-show";
import { Option } from "ts-std";

export type ErrorPath = ReadonlyArray<string>;

/**
 * @api public
 *
 * A represenation of a failed validation, not including its location. This object
 * can be used together with a formatter to produce human-readable errors. The
 * information provided in an `ErrorMessage` should be enough to properly
 * internationalize the error message or use it in other localization contexts.
 */
export interface ErrorMessage {
  name: string;
  details: unknown;
}

/**
 * @api public
 *
 * A representation of a failed validation, including the location in the validated
 * object where the validation failed.
 */
export interface ValidationError {
  path: ErrorPath;
  message: ErrorMessage;
}

/**
 * @api host
 *
 * An object that provides host-specific behavior for validators. It is passed in to
 * all `ValidatorFactory`s, so hosts can also extend Environment to communicate with
 * validators written to be used in that environment.
 */
export interface Environment {
  get(object: unknown, key: string | number): unknown;
}

/**
 * @api primitive
 *
 * A function that takes an environment and validator options and produces a new
 * Validator function. In other words, it curries the environment and options.
 */
export type ValidatorFactory<T, Options> = (
  options: Options,
  env: Environment
) => Validator<T>;

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
export type Validator<T = unknown> = (
  value: T,
  context: Option<string>
) => Task<ValidationError[]>;

/**
 * @api primitive
 *
 * A low-level representation of a validation.
 */
export type ValidationDescriptor<T = unknown, Options = unknown> = Readonly<{
  name: string;
  validator: ValidatorFactory<T, Options>;
  options: Options;
  contexts?: ReadonlyArray<string>;
}>;
