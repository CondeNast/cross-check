import { ValidationError } from "@cross-check/core";
import { ValidationBuilder } from "../builders";
import { isAbsent, isNull } from "./is";

function unwrapErrors(errors: ValidationError[]) {
  if (errors.length !== 1) {
    throw new Error("Cannot unwrap multiple errors");
  }
  if (errors[0].message.name !== "multiple") {
    throw new Error(`Expected error to have name "multiple", but got "${errors[0].message.name}"`);
  }

  let result = errors[0].message.details as ValidationError[][];

  if (result.length !== 2) {
    throw new Error(`Expected error details to have 2 items, but got ${result.length} items`);
  }
  if (result[0][0].message.name !== "type") {
    throw new Error(`Expected error to have name "type", but got "${result[0][0].message.name}"`);
  }

  return result[1];
}

export function nullable<T>(
  builder: ValidationBuilder<T>
): ValidationBuilder<T | null> {
  return isNull()
    .or(builder)
    .catch(unwrapErrors);
}

export function maybe<T>(
  builder: ValidationBuilder<T>
): ValidationBuilder<T | null | undefined | void> {
  return isAbsent()
    .or(builder)
    .catch(unwrapErrors);
}
