import {
  ObjectModel,
  ValidationDescriptor,
  ValidationError,
  Validity,
  cast,
  validate
} from "@cross-check/core";
import { Task } from "no-show";
import { Dict, Indexable, Option, Present, dict, entries } from "ts-std";
import { ValidationBuilder, build, validates } from "../builders";
import { FIXME } from "../utils";
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
  implements ValidatorInstance<Present> {
  static validatorName = "fields";

  constructor(
    protected objectModel: ObjectModel,
    protected descriptors: Dict<ValidationDescriptor<T, U>>
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
            this.objectModel.get(value, key) as T,
            descriptor! as FIXME<any>,
            context,
            this.objectModel
          )
        );

        if (validity.valid === false) {
          errors.push(...validity.errors.map(error => mapError(error, key)));
        }
      }

      return cast(value, errors);
    });
  }
}

/**
 * @api primitive
 *
 * The class that powers the `keys()` validator function.
 *
 * This validator checks that the value contains all of the enumerated fields
 * and also does not contain any extra fields.
 */
export class KeysValidator<T> implements ValidatorInstance<Indexable<T>> {
  static validatorName = "keys";

  constructor(
    protected objectModel: ObjectModel,
    protected descriptorKeys: string[]
  ) {}

  run(value: Indexable<T>): Task<Validity<Indexable<T>, Indexable<T>>> {
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

      return cast(value, errors);
    });
  }
}

export function fields<T>(
  builders: Dict<ValidationBuilder<T>>
): ValidationBuilder<Present> {
  return validates(
    "fields",
    factoryFor(FieldsValidator as ValidatorClass<
      Present,
      Dict<ValidationDescriptor<T>>
    >),
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
export function object(
  builders: Dict<ValidationBuilder<unknown>>
): ValidationBuilder<unknown> {
  return isObject().andThen(fields(builders));
}

/**
 * @api public
 */
export function strictObject(
  builders: Dict<ValidationBuilder<unknown>>
): ValidationBuilder<unknown> {
  return isObject()
    .andThen(keys(Object.keys(builders)))
    .andThen(fields(builders));
}

function normalizeFields<T>(
  builders: Dict<ValidationBuilder<T>>
): Dict<ValidationDescriptor<T>> {
  let out = dict<ValidationDescriptor<T>>();

  for (let [key, value] of entries(builders)) {
    out[key] = build(value!);
  }

  return out;
}
