import {
  Environment,
  ValidationError,
  Validator,
  ValidatorFactory
} from "@cross-check/core";
import { Task } from "no-show";
import { Option } from "ts-std";
import { ValidationBuilder, validates } from "../builders";

/**
 * @api primitive
 *
 * An interface that the main validator superclasses (such as `ValueValidator`) implement.
 * An implementation of `ValidatorClass` is passed into `factoryFor` or `builderFor`.
 *
 * @typeparam T        a valid input value for instances of this validator class
 * @typeparam Options  the options passed to the constructor of this validator class
 */
export interface ValidatorClass<T, Options> {
  validatorName: string;
  new (env: Environment, options: Options): ValidatorInstance<T>;
}

/**
 * @api primitive
 *
 * An instance of a `ValidatorClass`. If `T` is not `unknown`, this validator must
 * come after a previous validator that validates that the input is the expected
 * type.
 *
 * For example, if you have a `ValidatorInstance<string>` named `email()`, you
 * should chain it after a `string` validator.
 *
 * @typeparam T  a valid input value for this validator instance.
 */
export interface ValidatorInstance<T> {
  run(value: T, context: Option<string>): Task<ValidationError[]>;
}

/**
 * @internal
 *
 * Turns a `ValidatorClass` into a `ValidatorFactory`. Used internally by `builderFor`
 *
 */
export function factoryFor<T, Options>(
  Class: ValidatorClass<T, Options>
): ValidatorFactory<T, Options> {
  return (env: Environment, options: Options): Validator<T> => {
    let validator = new Class(env, options);
    return (value, context) => validator.run(value, context);
  };
}

/**
 * @api public
 *
 * Turns a `ValidatorClass` into a function that takes options and returns a `ValidationBuilder`.
 *
 * Used to convert a subclass of the public validator classes into a builder, so that users can
 * use `andThen`, `andAlso`, `or`, etc. on them, and also so they can be used as the inner value
 * of `array()` or `object()` validators.
 *
 * ```ts
 * class PercentValidator extends ValueValidator<number, void> {
 *   validate(value: number): ErrorMessage | void {
 *     if (value < 0 || value > 100) {
 *       return { type: 'percent', args: null };
 *     }
 *   }
 * }
 *
 * export function percent(): ValidationBuilder<number> {
 *   return builderFor(ValueValidator);
 * }
 * ```
 */
export function builderFor<T>(
  Class: ValidatorClass<T, void>
): () => ValidationBuilder<T>;
export function builderFor<T, Options>(
  Class: ValidatorClass<T, Options>
): (options: Options) => ValidationBuilder<T>;
export function builderFor<T, Options>(
  Class: ValidatorClass<T, Options>
): (options: Options) => ValidationBuilder<T> {
  let factory = factoryFor(Class);

  return (options: Options) => validates(Class.validatorName, factory, options);
}
