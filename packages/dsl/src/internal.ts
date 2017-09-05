/**
 * The functions in this file should not be re-exported from index.ts
 */

import { ValidationDescriptor, ValidationDescriptors } from '@validations/core';
import { isReadonlyArray, unknown } from 'ts-std';

/** @internal */
export function descriptor(
  name: string,
  _args: unknown[],
  _keys: string[],
  _contexts: string[]
): ValidationDescriptor {
  let args = Object.freeze(_args);
  let validator = Object.freeze({ name, args });
  let keys = Object.freeze(_keys);
  let contexts = Object.freeze(_contexts);

  return Object.freeze({ validator, keys, contexts });
}

/** @internal */
export interface Buildable {
  build(): ValidationDescriptors;
}

/** @internal */
export function build(builders: Buildable | ReadonlyArray<Buildable>): ValidationDescriptors {
  if (isReadonlyArray(builders)) {
    let descriptors = [];

    for (let builder of builders) {
      descriptors.push(...builder.build());
    }

    return descriptors;
  } else {
    return builders.build();
  }
}
