import { ObjectModel, ValidationError } from "@cross-check/core";
import {
  Record,
  RecordBuilder,
  RecordImpl,
  Registry
} from "@cross-check/schema";
import { Task } from "no-show";

export const ENV: ObjectModel = {
  get(object: unknown, key: string): unknown {
    if (object === null || object === undefined) return;
    return (object as { [key: string]: unknown })[key];
  },

  asList(object: unknown): Array<unknown | null> {
    if (Array.isArray(object)) {
      return object;
    } else {
      return null;
    }
  }
};

export function strip(
  strings: TemplateStringsArray,
  ...expressions: Array<unknown>
): string {
  let result = strings
    .map((s, i) => `${s}${expressions[i] ? expressions[i] : ""}`)
    .join("");

  let lines = result.split("\n").slice(1, -1);

  let leading = lines.reduce((accum, line) => {
    if (line.match(/^\s*$/)) return accum;
    let size = line.match(/^(\s*)/)![1].length;
    return Math.min(accum, size);
  }, Infinity);

  lines = lines.map(l => l.slice(leading));

  return lines.join("\n");
}

export function validate(
  record: RecordImpl,
  obj: { [key: string]: unknown }
): Task<ValidationError[]> {
  return record.validate(obj, ENV);
}

export function validateDraft(
  record: RecordBuilder,
  registry: Registry,
  obj: { [key: string]: unknown }
): Task<ValidationError[]> {
  return record.with({ draft: true, registry }).validate(obj, ENV);
}

export function validatePublished(
  record: Record,
  registry: Registry,
  obj: { [key: string]: unknown }
): Task<ValidationError[]> {
  return record.with({ registry }).validate(obj, ENV);
}

export function typeError(
  kind: string,
  path: string | null = null
): ValidationError {
  return {
    message: { details: kind, name: "type" },
    path: path ? path.split(".") : []
  };
}

export function missingError(path: string | null = null) {
  return typeError("present", path);
}

export function keysError({
  extra = [],
  missing = [],
  path = null
}: {
  extra?: string[];
  missing?: string[];
  path?: string | null;
}): ValidationError {
  let errors = [];

  for (let m of missing) {
    errors.push(typeError("present", m));
  }

  for (let e of extra) {
    errors.push(typeError("absent", e));
  }

  return {
    message: { name: "keys", details: errors },
    path: path ? path.split(".") : []
  };
}

export function error(
  kind: string,
  problem: unknown,
  path: string | null = null
): ValidationError {
  return {
    message: { details: problem, name: kind },
    path: path ? path.split(".") : []
  };
}

export const GRAPHQL_SCALAR_MAP = {
  // Custom scalars
  SingleLine: "SingleLine",
  SingleWord: "SingleWord",
  ISODate: "ISODate",
  Url: "Url",

  Text: "String",
  Integer: "Int",
  Number: "Float",
  Boolean: "Boolean"
};
