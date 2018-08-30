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

export interface Valid<T> {
  valid: true;
  value: T;
}

export interface Invalid<T> {
  valid: false;
  value: T;
  errors: ValidationError[];
}

export type Validity<T, U> = Valid<T> | Invalid<U>;

export function valid<T, U extends T>(value: U): Validity<T, U> {
  return {
    valid: true,
    value
  };
}

export function invalid<T, U extends T>(
  value: T,
  errors: ValidationError[]
): Validity<T, U> {
  return {
    valid: false,
    value,
    errors
  } as Validity<T, U>;
}

export function cast<T, U extends T>(
  value: T,
  errors: ValidationError[]
): Validity<T, U> {
  if (errors.length === 0) {
    return valid(value as U);
  } else {
    return invalid(value, errors);
  }
}

export function toErrors(
  validity: Validity<unknown, unknown>
): ValidationError[] {
  if (validity.valid) {
    return [];
  } else {
    return validity.errors;
  }
}

/**
 * @api host
 *
 * An object that provides host-specific behavior for validators. It is passed in to
 * all `ValidatorFactory`s, so hosts can also extend ObjectModel to communicate with
 * validators written to be used in that object model.
 */
export interface ObjectModel {
  get(object: unknown, key: string | number): unknown;

  /**
   * This function takes any object, and returns `null` if the object
   * should not be treated as an array by the built-in validators, and
   * an iterable if the object should be treated as an array.
   *
   * If the underlying object is a simple array, it's fine to return it.
   *
   * You can also return an iterable, which will only be called if the
   * internals need to iterate over the values. This can save work if
   * the process of turning your value into an Array is expensive.
   *
   * For example, if you have an Immutable.js list that you want the
   * built-in validators to treat as a list, you could write:
   *
   * ```ts
   * const ENV = {
   *   asList(object) {
   *     if (List.isList(object) || Array.isArray(object)) {
   *       return object[Symbol.iterator]();
   *     } else {
   *       return null;
   *     }
   *   }
   * };
   * ```
   *
   * If you are working with a collection that doesn't already support
   * `Symbol.iterator`, you can easily adapt it. For example, say you're
   * working with an array-like structure that has a `toArray` method on
   * it.
   *
   * Cross Check might invoke asList multiple times, but will only invoke
   * the generator if it wants to validate the contents of the list.
   *
   * ```ts
   * import { isArray } from "@ember/array";
   *
   * const ENV = {
   *   asList(object) {
   *     // support built-in Arrays
   *     if (Array.isArray(object)) {
   *       return object;
   *     } else if (isArray(object)) {
   *       return iterable(object);
   *     } else {
   *       return null;
   *     }
   *   }
   * };
   *
   * function* iterable(object) {
   *   // This will only run if cross-check attempts to iterate,
   *   // so we don't need to worry about the cost of coercing into
   *   // an array.
   *   let array = object.toArray();
   *
   *   for (let item of array) {
   *     yield item;
   *   }
   * }
   * ```
   *
   * @param object
   */
  asList(object: unknown): Option<Iterable<unknown> | Array<unknown>>;
}

/** @deprecated */
export type Environment = ObjectModel;

/**
 * @api primitive
 *
 * A function that takes an object model and validator options and produces a new
 * Validator function. In other words, it curries the object model and options.
 */
export type ValidatorFactory<T, U extends T = T> = (
  options: unknown,
  objectModel: ObjectModel
) => Validator<T, U>;

export type KnownValidatorFactory<T, U extends T, Options> = (
  options: Options,
  objectModel: ObjectModel
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
) => Task<Validity<T, U>>;

/**
 * @api primitive
 *
 * A low-level representation of a validation.
 */
export type ValidationDescriptor<T = unknown, U extends T = U> = Readonly<{
  name: string;
  validator: ValidatorFactory<T, U>;
  options: unknown;
  contexts?: ReadonlyArray<string>;
}>;
