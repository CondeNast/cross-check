import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  validate
} from "@cross-check/core";
import normalize, { ValidationBuilder, validates } from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, Indexable, Option, dict, entries, unknown } from "ts-std";
import { ValidatorClass, ValidatorInstance, factoryFor } from "./abstract";
import { isObject } from "./is";

function mapError(
  { path, message }: ValidationError,
  key: string
): ValidationError {
  return { path: [key, ...path], message };
}

/**
 * @api primitive
 *
 * The class that powers the `fields()` validator function.
 *
 * Use this if you want to refine this validator and implement your own
 * custom `fields()`.
 */
export class FieldsValidator<T> implements ValidatorInstance<Indexable<T>> {
  static validatorName = "fields";

  constructor(
    protected env: Environment,
    protected descriptors: Dict<ValidationDescriptor<T>>
  ) {}

  run(value: Indexable<T>, context: Option<string>): Task<ValidationError[]> {
    return new Task(async run => {
      let errors: ValidationError[] = [];

      for (let [key, descriptor] of entries(this.descriptors)) {
        let suberrors = await run(
          validate(
            this.env.get(value, key) as T,
            descriptor!,
            context,
            this.env
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
export class KeysValidator<T> implements ValidatorInstance<Indexable<T>> {
  static validatorName = "keys";

  constructor(
    protected env: Environment,
    protected descriptorKeys: string[]
  ) { }

  run(value: Indexable<T>): Task<ValidationError[]> {
    return new Task(async () => {
      let errors: ValidationError[] = [];
      let valueKeys = Object.keys(value);

      for (let key of this.descriptorKeys) {
        let index = valueKeys.indexOf(key);
        if (index === -1) {
          // descriptor field is not present in the value
          errors.push({ path: [key], message: { name: "type", details: "present" } });
        } else {
          valueKeys.splice(index, 1);
        }
      }

      // these fields were not present in the descriptors
      errors.push(...valueKeys.map(key => ({ path: [key], message: { name: "type", details: "absent" } })));

      return errors;
    });
  }
}

export function fields<T>(
  builders: Dict<ValidationBuilder<T>>
): ValidationBuilder<Indexable<T>> {
  return validates(
    "fields",
    factoryFor(FieldsValidator as ValidatorClass<
      Indexable<T>,
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
    factoryFor(KeysValidator as ValidatorClass<
      Indexable<T>,
      string[]
    >),
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
    out[key] = normalize(value!);
  }

  return out;
}
