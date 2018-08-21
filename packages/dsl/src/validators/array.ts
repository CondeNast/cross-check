import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  validate
} from "@cross-check/core";
import { Task } from "no-show";
import { Option } from "ts-std";
import { ValidationBuilder, build } from "../builders";
import { ValidatorClass, ValidatorInstance, builderFor } from "./abstract";
import { isArray } from "./is";

function mapError(
  { path, message }: ValidationError,
  index: number
): ValidationError {
  return { path: [String(index), ...path], message };
}

/**
 * @api primitive
 *
 * The class that powers the `items()` validator function.
 *
 * Use this if you want to refine this validator and implement your own
 * custom `items()`.
 */
export class ItemsValidator<T = unknown> implements ValidatorInstance<T[]> {
  static validatorName = "array-items";

  constructor(
    protected env: Environment,
    protected descriptor: ValidationDescriptor<T>
  ) {}

  run(value: T[], context: Option<string>): Task<ValidationError[]> {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let i = 0; i < value.length; i++) {
        let suberrors = await run(
          validate(value[i], this.descriptor, context, this.env)
        );
        errors.push(...suberrors.map(error => mapError(error, i)));
      }

      return errors;
    });
  }
}

/**
 * @api primitive
 *
 * Validates that each element of the array validates in accordance with the
 * inner validator.
 *
 * This validator is meant to be checked after already validating that the
 * value is an array, and the most common way to do that is to use the
 * `array()` validator directly.
 *
 * Use the `items` validator if you already know for sure that the value is
 * an array, or you want to use a validator other than `isArray()` to validate
 * that the value is an array.
 *
 * Generally speaking, you should normally use `array()`.
 */
export function items<T>(
  builder: ValidationBuilder<T>
): ValidationBuilder<T[]> {
  return builderFor(ItemsValidator as ValidatorClass<
    T[],
    ValidationDescriptor<T>
  >)(build(builder));
}

/**
 * @api public
 *
 * Validates that the value is an array, and that each element of the array validates
 * in accordance with the inner validator.
 *
 * If any of the elements of the array don't validate correctly, this validator will
 * produce a validation error whose path is the index in the array with the problem,
 * and whose error message is the validation error for failing the inner validation.
 *
 * If the value itself is not an array, this validation will fail with the error
 * `{ key: 'type', args: 'array' }`.
 */
export function array(
  builder: ValidationBuilder<unknown>
): ValidationBuilder<unknown> {
  return isArray().andThen(items(builder));
}
