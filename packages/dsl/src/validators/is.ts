import { ErrorMessage, ValidationError } from "@cross-check/core";
import { Absent, Present, isIndexable as indexable } from "ts-std";
import { ValidationBuilder, validates } from "../builders";
import { builderFor, factoryFor } from "./abstract";
import { BasicValidator } from "./basic";
import { ValueValidator } from "./value";

export type Checker<From, To extends From> = (value: From) => value is To;

export function is<From, To extends From>(
  checker: Checker<From, To>,
  type: string
): () => ValidationBuilder<From> {
  class Validator extends ValueValidator<From, void> {
    static validatorName = `is-${type}`;

    validate(value: From): ErrorMessage | void {
      return checker(value) ? undefined : { name: "type", details: type };
    }
  }

  let builder = validates(`is-${type}`, factoryFor(Validator), undefined);

  return () => builder;
}

function isTypeOf<To>(typeOf: string): () => ValidationBuilder<unknown> {
  return is((value: unknown): value is To => typeof value === typeOf, typeOf);
}

export type NotNull = Present | undefined;
export type NotUndefined = Present | null;

export const isAbsent = is(
  (value: unknown): value is Absent => value === null || value === undefined,
  "absent"
);
export const isPresent = is(
  (value: unknown): value is Present => value !== null && value !== undefined,
  "present"
);
export const isNull = is(
  (value: unknown): value is null => value === null,
  "null"
);
export const isNotNull = is(
  (value: unknown): value is NotNull => value !== null,
  "not-null"
);
export const isUndefined = is(
  (value: unknown): value is undefined => value === undefined,
  "undefined"
);
export const isNotUndefined = is(
  (value: unknown): value is NotUndefined => value !== undefined,
  "not-undefined"
);

export const isNumber = isTypeOf("number");
export const isBoolean = isTypeOf("boolean");
export const isString = isTypeOf("string");
export const isSymbol = isTypeOf("symbol");
export const isFunction = isTypeOf("function");
export const isIndexable = is(indexable, "indexable");
export const isObject = is(
  (value: unknown): value is object =>
    value !== null && typeof value === "object" && !Array.isArray(value),
  "object"
);

export class IsArrayValidator extends BasicValidator<unknown> {
  static validatorName = "is-array";

  validate(value: unknown): ValidationError[] {
    if (this.objectModel.asList(value) !== null) {
      return [];
    } else {
      return [{ path: [], message: { name: "type", details: "array" } }];
    }
  }
}

export class IsISODateStringValidator extends BasicValidator<unknown> {
  static validatorName = "is-ISODateString";

  validate(value: unknown): ValidationError[] {
    if (value === undefined) {
        return [];
    }
    let parsed = Date.parse(value);

    if (isNaN(parsed))
      return [{ path: [], message: { name: "ISODateString" } }];
  
    if (value === new Date(parsed).toISOString()) {
      return [];
    } else {
      return [{ path: [], message: { name: "ISODateString" } }];
    }
  }
}

export const isArray = builderFor(IsArrayValidator);
export const isISODateString = builderFor(IsISODateStringValidator);
