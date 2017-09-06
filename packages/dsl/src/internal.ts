/**
 * The functions in this file should not be re-exported from index.ts
 */

import { ValidationDescriptor, ValidationDescriptors, ValidatorFactory } from '@validations/core';
import { unknown } from 'ts-std';

/** @internal */
export function descriptor(
  factory: ValidatorFactory,
  options: unknown,
  _contexts: string[]
): ValidationDescriptor {
  let contexts = Object.freeze(_contexts);

  return Object.freeze({ factory, options, contexts });
}

/** @internal */
export interface Buildable {
  build(): ValidationDescriptors;
}

/** @internal */
export function build(...builders: Buildable[]): ValidationDescriptors {
  let descriptors = [];

  for (let builder of builders) {
    descriptors.push(...builder.build());
  }

  return descriptors;
}
