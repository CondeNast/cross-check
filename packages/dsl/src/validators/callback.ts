import {
  ErrorMessage,
  ObjectModel,
  Task,
  Validator,
} from "@condenast/cross-check";

export type ValidationResult = ErrorMessage | void;
export type ValidationCallback<T> = (
  value: T,
  objectModel: ObjectModel
) => ValidationResult | PromiseLike<ValidationResult>;

export function factoryForCallback<T>(
  cb: ValidationCallback<T>,
  objectModel: ObjectModel
): Validator<T> {
  return (value) => {
    return new Task(async (run) => {
      const message = await run(cb(value, objectModel));

      if (message) {
        return [{ path: [], message, level: "error" }];
      } else {
        return [];
      }
    });
  };
}
