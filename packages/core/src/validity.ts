export type ErrorPath = ReadonlyArray<string>;

/**
 * @api public
 *
 * A represenation of a failed validation, not including its location. This object
 * can be used together with a formatter to produce human-readable errors. The
 * information provided in an `ErrorMessage` should be enough to properly
 * internationalize the error message or use it in other localization contexts.
 */
export interface ErrorMessage {
  name: string;
  details: unknown;
}

/**
 * @api public
 *
 * A representation of a failed validation, including the location in the validated
 * object where the validation failed.
 */
export interface ValidationError {
  path: ErrorPath;
  message: ErrorMessage;
}

export interface ValidValue<T> {
  valid: true;
  value: T;
}

export interface InvalidValue<T> {
  valid: false;
  value: T;
  errors: ValidationError[];
}

export type Validity<T, U extends T> = ValidValue<U> | InvalidValue<T>;

export function valid<T, U extends T>(value: U): Validity<T, U> {
  return {
    valid: true,
    value
  };
}

export function invalid<T, U extends T>(
  value: T,
  errors: ValidationError[]
): Validity<T, U> {
  return {
    valid: false,
    value,
    errors
  };
}
