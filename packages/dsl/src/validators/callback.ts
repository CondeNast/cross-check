import { Environment, ErrorMessage, Validator } from "@cross-check/core";
import { Task } from "no-show";

export type ValidationResult = ErrorMessage | void;
export type ValidationCallback<T> = (
  value: T,
  env: Environment
) => ValidationResult | PromiseLike<ValidationResult>;

export function factoryForCallback<T>(
  cb: ValidationCallback<T>,
  env: Environment
): Validator<T> {
  return value => {
    return new Task(async run => {
      let message = await run(cb(value, env));

      if (message) {
        return [{ path: [], message }];
      } else {
        return [];
      }
    });
  };
}
