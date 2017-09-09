/**
 * The functions in this file should not be re-exported from index.ts
 */

import { ValidationDescriptor, ValidationDescriptors, ValidatorFactory } from '@validations/core';
import { unknown } from 'ts-std';

/** @internal */
export function descriptor(
  factory: ValidatorFactory,
  options: unknown,
  contexts: ReadonlyArray<string>
): ValidationDescriptor {
  return { factory, options, contexts };
}

/** @internal */
export interface Buildable {
  build(): ValidationDescriptor;
}

/** @internal */
export function build(...builders: Buildable[]): ValidationDescriptors {
  let descriptors = [];

  for (let builder of builders) {
    descriptors.push(builder.build());
  }

  return descriptors;
}
