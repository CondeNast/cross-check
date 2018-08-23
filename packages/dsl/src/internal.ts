/**
 * The functions in this file should not be re-exported from index.ts
 */

import { ValidationDescriptor, ValidatorFactory } from "@cross-check/core";

/** @internal */
export function descriptor<T, U extends T, Options>(
  name: string,
  validator: ValidatorFactory<T, U, Options>,
  options: Options,
  contexts: ReadonlyArray<string>
): ValidationDescriptor<T, U, Options> {
  return { name, validator, options, contexts };
}
