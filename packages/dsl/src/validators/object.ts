import {
  ObjectModel,
  ValidationDescriptor,
  ValidationError,
  validate
} from "@cross-check/core";
import { Task } from "no-show";
import { ValidationBuilder, build, validates } from "../builders";
import { ValidatorClass, ValidatorInstance, factoryFor } from "./abstract";
import { isObject, Present } from "./is";

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
export class FieldsValidator<T> implements ValidatorInstance<Present> {
  static validatorName = "fields";

  constructor(
    protected objectModel: ObjectModel,
    protected descriptors: Record<string, ValidationDescriptor<T>>
  ) {}

  run(value: Present, context: string | null): Task<ValidationError[]> {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let [key, descriptor] of Object.entries(this.descriptors)) {
        let suberrors = await run(
          validate(
            this.objectModel.get(value, key) as T,
            descriptor!,
            context,
            this.objectModel
          )
        );
        errors.push(...suberrors.map(error => mapError(error, key)));
      }

      return errors;
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
export class KeysValidator<T> implements ValidatorInstance<Readonly<Record<string, T>>> {
  static validatorName = "keys";

  constructor(
    protected objectModel: ObjectModel,
    protected descriptorKeys: string[]
  ) {}

  run(value: Readonly<Record<string, T>>): Task<ValidationError[]> {
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
        return [{ path: [], message: { name: "keys", details: errors } }];
      } else {
        return [];
      }
    });
  }
}

export function fields<T>(
  builders: Record<string, ValidationBuilder<T>>
): ValidationBuilder<Present> {
  return validates(
    "fields",
    factoryFor(FieldsValidator as ValidatorClass<
      Present,
      Record<string, ValidationDescriptor<T>>
    >),
    normalizeFields(builders)
  );
}

export function keys<T>(
  descriptorKeys: string[]
): ValidationBuilder<Readonly<Record<string, T>>> {
  return validates(
    "keys",
    factoryFor(KeysValidator as ValidatorClass<Readonly<Record<string, T>>, string[]>),
    descriptorKeys
  );
}

/**
 * @api public
 */
export function object(
  builders: Record<string, ValidationBuilder<unknown>>
): ValidationBuilder<unknown> {
  return isObject().andThen(fields(builders));
}

/**
 * @api public
 */
export function strictObject(
  builders: Record<string, ValidationBuilder<unknown>>
): ValidationBuilder<unknown> {
  return isObject()
    .andThen(keys(Object.keys(builders)))
    .andThen(fields(builders));
}

function normalizeFields<T>(
  builders: Record<string, ValidationBuilder<T>>
): Record<string, ValidationDescriptor<T>> {
  let out: Record<string, ValidationDescriptor<T>> = Object.create(null);

  for (let [key, value] of Object.entries(builders)) {
    out[key] = build(value);
  }

  return out;
}
