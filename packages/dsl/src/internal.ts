/**
 * The functions in this file should not be re-exported from index.ts
 */

import {
  KnownValidatorFactory,
  ValidationDescriptor,
  ValidatorFactory
} from "@cross-check/core";

/** @internal */
export function descriptor<T, U extends T = T>(
  name: string,
  validator: ValidatorFactory<T, U>,
  options: unknown,
  contexts: ReadonlyArray<string>
): ValidationDescriptor<T, U>;
export function descriptor<T, U extends T = T>(
  name: string,
  validator: KnownValidatorFactory<T, U, any>,
  options: any,
  contexts: ReadonlyArray<string>
): ValidationDescriptor<T, U>;
export function descriptor<T, U extends T = T>(
  name: string,
  validator: ValidatorFactory<T, U>,
  options: unknown,
  contexts: ReadonlyArray<string>
): ValidationDescriptor<T, U> {
  return { name, validator, options, contexts };
}
