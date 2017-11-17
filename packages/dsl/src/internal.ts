/**
 * The functions in this file should not be re-exported from index.ts
 */

import { ValidationDescriptor, ValidatorFactory } from '@cross-check/core';
import { unknown } from 'ts-std';

/** @internal */
export function descriptor<T>(
  factory: ValidatorFactory<T, unknown>,
  options: unknown,
  contexts: ReadonlyArray<string>
): ValidationDescriptor<T> {
  return { factory, options, contexts };
}
