import {
  ErrorMessage,
  ObjectModel,
  Task,
  Validator,
} from "@condenast/cross-check";

export type ValidationResult = ErrorMessage | void;
export type ValidationCallback<T, M extends ObjectModel = ObjectModel> = (
  value: T,
  objectModel: M
) => ValidationResult | PromiseLike<ValidationResult>;

export function factoryForCallback<T, M extends ObjectModel = ObjectModel>(
  cb: ValidationCallback<T>,
  objectModel: M
): Validator<T> {
  return (value) => {
    return new Task(async (run) => {
      let message = await run(cb(value, objectModel));

      if (message) {
        return [{ path: [], message }];
      } else {
        return [];
      }
    });
  };
}
