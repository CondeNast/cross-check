import { Task } from "no-show";
import { Indexable, Option } from "ts-std";
import {
  ObjectModel,
  ValidationDescriptor,
  ValidationError
} from "./descriptor";

const DEFAULT_OBJECT_MODEL: ObjectModel = {
  get(object: unknown, key: string | number): unknown {
    if (object !== null && object !== undefined) {
      return (object as Indexable)[key];
    } else {
      return object;
    }
  },

  asList(object: unknown): Option<Array<unknown>> {
    if (Array.isArray(object)) {
      return object;
    } else {
      return null;
    }
  }
};

/**
 * @api public
 *
 * A function that takes an object model, value, descriptor and context, and (asynchronously)
 * produces an array of validation errors. If this function produces an empty array, the
 * validation succeeded.
 *
 * The "context" is an app-specific concept. For example, an app might want to separate
 * between validations that must pass when drafting an article vs. validations that
 * must pass when publishing an article. If a validation descriptor does not specify
 * the context passed in to `validate`, the validation passes.
 *
 * @param objectModel The host object model
 * @param value The value to validate; it need not be an object
 * @param descriptor A validation descriptor to use to validate the value; a single validation
 *  descriptor can represent multiple composed validations
 * @param context Optionally, a string that represents the saving context
 */
export function validate<T, Options>(
  value: T,
  descriptor: ValidationDescriptor<T, Options>,
  context: Option<string> = null,
  objectModel: ObjectModel = DEFAULT_OBJECT_MODEL
): Task<ValidationError[]> {
  return new Task(async run => {
    let { validator, options, contexts } = descriptor;

    if (context !== null && contexts && contexts.length) {
      if (contexts.indexOf(context) === -1) return [];
    }

    let validateFunction = validator(options, objectModel);

    return await run(validateFunction(value, context));
  });
}
