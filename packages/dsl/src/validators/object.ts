import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  Validity,
  invalid,
  valid,
  validate
} from "@cross-check/core";
import { Task } from "no-show";
import { Dict, Indexable, Option, Present, dict, entries } from "ts-std";
import { ValidationBuilder, build, validates } from "../builders";
import { ValidatorClass, ValidatorInstance, factoryFor } from "./abstract";
import { isObject } from "./is";

function mapError(
  { path, message }: ValidationError,
  key: string | number
): ValidationError {
  return { path: [String(key), ...path], message };
}

/**
 * @api primitive
 *
 * The class that powers the `fields()` validator function.
 *
 * Use this if you want to refine this validator and implement your own
 * custom `fields()`.
 */
export class FieldsValidator<T, U extends T>
  implements ValidatorInstance<Present, Dict<U>> {
  static validatorName = "fields";

  constructor(
    protected env: Environment,
    protected descriptors: Dict<ValidationDescriptor<T>>
  ) {}

  run(
    value: Present,
    context: Option<string>
  ): Task<Validity<Present, Dict<U>>> {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let [key, descriptor] of entries(this.descriptors)) {
        let validity = await run(
          validate(
            this.env.get(value, key) as T,
            descriptor!,
            context,
            this.env
          )
        );

        if (validity.valid === false) {
          errors.push(...validity.errors.map(error => mapError(error, key)));
        }
      }

      if (errors.length === 0) {
        return valid(value as Dict<U>);
      } else {
        return invalid(value, errors);
      }
    });
  }
}

export type Shape<K extends string> = { [P in K]: unknown };

/**
 * @api primitive
 *
 * The class that powers the `keys()` validator function.
 *
 * This validator checks that the value contains all of the enumerated fields
 * and also does not contain any extra fields.
 */
export class KeysValidator<I extends Indexable, K extends string>
  implements ValidatorInstance<I, I & Shape<K>> {
  static validatorName = "keys";

  constructor(protected env: Environment, protected descriptorKeys: string[]) {}

  run(value: I): Task<Validity<I, I & Shape<K>>> {
    return new Task(async () => {
      let errors: ValidationError[] = [];
      let valueKeys = Object.keys(value);

      for (let key of this.descriptorKeys) {
        let index = valueKeys.indexOf(key);
        if (index === -1) {
          // descriptor field is not present in the value
          errors.push({
            path: [key],
            message: { name: "type", details: "present" }
          });
        } else {
          valueKeys.splice(index, 1);
        }
      }

      // these fields were not present in the descriptors
      errors.push(
        ...valueKeys.map(key => ({
          path: [key],
          message: { name: "type", details: "absent" }
        }))
      );

      if (errors.length) {
        return invalid(value, [
          { path: [], message: { name: "keys", details: errors } }
        ]);
      } else {
        return valid(value as I & Shape<K>);
      }
    });
  }
}

export function fields<T, U extends T>(
  builders: Dict<ValidationBuilder<T, U>>
): ValidationBuilder<Present, Dict<U>> {
  return validates(
    "fields",
    factoryFor(FieldsValidator),
    normalizeFields(builders)
  );
}

export function keys<T>(
  descriptorKeys: string[]
): ValidationBuilder<Indexable<T>> {
  return validates(
    "keys",
    factoryFor(KeysValidator as ValidatorClass<Indexable<T>, string[]>),
    descriptorKeys
  );
}

/**
 * @api public
 */
export function object<T, U extends T>(
  builders: Dict<ValidationBuilder<unknown, U>>
): ValidationBuilder<unknown, Dict<U>> {
  return isObject().andThen(fields(builders));
}

/**
 * @api public
 */
export function strictObject<D extends Dict>(
  builders: Dict<ValidationBuilder<unknown, D>>
): ValidationBuilder<unknown, D> {
  return isObject()
    .andThen(keys(Object.keys(builders)))
    .andThen(fields(builders));
}

function normalizeFields<T, U extends T>(
  builders: Dict<ValidationBuilder<T, U>>
): Dict<ValidationDescriptor<T, U>> {
  let out = dict<ValidationDescriptor<T, U>>();

  for (let [key, value] of entries(builders)) {
    out[key] = build(value!);
  }

  return out;
}
