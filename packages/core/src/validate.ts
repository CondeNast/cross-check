import { Task } from "no-show";
import { Indexable, Option } from "ts-std";
import { ValidationDescriptor } from "./descriptor";
import { Environment } from "./environment";
import { Validity } from "./validity";

const DEFAULT_ENVIRONMENT: Environment = {
  get(object: unknown, key: string | number): unknown {
    if (object !== null && object !== undefined) {
      return (object as Indexable)[key];
    } else {
      return object;
    }
  },

  asArray(object: unknown): Option<Iterator<unknown>> {
    if (Array.isArray(object)) {
      return object[Symbol.iterator]();
    } else {
      return null;
    }
  }
};

/**
 * @api public
 *
 * A function that takes an environment, value, descriptor and context, and (asynchronously)
 * produces an array of validation errors. If this function produces an empty array, the
 * validation succeeded.
 *
 * The "context" is an app-specific concept. For example, an app might want to separate
 * between validations that must pass when drafting an article vs. validations that
 * must pass when publishing an article. If a validation descriptor does not specify
 * the context passed in to `validate`, the validation passes.
 *
 * @param env The host environment
 * @param value The value to validate; it need not be an object
 * @param descriptor A validation descriptor to use to validate the value; a single validation
 *  descriptor can represent multiple composed validations
 * @param context Optionally, a string that represents the saving context
 */
export function validate<T, U extends T>(
  value: T,
  descriptor: ValidationDescriptor<T, U, unknown>,
  context: Option<string> = null,
  env: Environment = DEFAULT_ENVIRONMENT
): Task<Validity<T, U>> {
  return new Task(async run => {
    let { validator, options, contexts } = descriptor;

    if (context !== null && contexts && contexts.length) {
      if (contexts.indexOf(context) === -1) return [];
    }

    let validateFunction = validator(options, env);

    return await run(validateFunction(value, context));
  }) as Task<Validity<T, U>>;
}
