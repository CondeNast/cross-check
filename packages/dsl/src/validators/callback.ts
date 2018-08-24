import {
  Environment,
  ErrorMessage,
  Validator,
  invalid,
  valid
} from "@cross-check/core";
import { Task } from "no-show";

export type ValidationResult = ErrorMessage | void;
export type ValidationCallback<T> = (
  value: T,
  env: Environment
) => ValidationResult | PromiseLike<ValidationResult>;

export function factoryForCallback<T, U extends T>(
  cb: ValidationCallback<T>,
  env: Environment
): Validator<T, U> {
  return value => {
    return new Task(async run => {
      let message = await run(cb(value, env));

      if (message) {
        return invalid(value, [{ path: [], message }]);
      } else {
        return valid(value as U);
      }
    });
  };
}
