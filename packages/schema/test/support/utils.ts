import { Environment, ValidationError } from "@cross-check/core";
import {
  Record,
  RecordBuilder,
  RecordImpl,
  Registry
} from "@cross-check/schema";
import { Task } from "no-show";
import { Dict, Option } from "ts-std";

export const ENV: Environment = {
  get(object: unknown, key: string): unknown {
    if (object === null || object === undefined) return;
    return (object as Dict<unknown>)[key];
  },

  asList(object: unknown): Option<Array<unknown>> {
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
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return record.validate(obj, ENV);
}

export function validateDraft(
  record: RecordBuilder,
  registry: Registry,
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return record.with({ draft: true, registry }).validate(obj, ENV);
}

export function validatePublished(
  record: Record,
  registry: Registry,
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return record.with({ registry }).validate(obj, ENV);
}

export function typeError(
  kind: string,
  path: Option<string> = null
): ValidationError {
  return {
    message: { details: kind, name: "type" },
    path: path ? path.split(".") : []
  };
}

export function missingError(path: Option<string> = null) {
  return typeError("present", path);
}

export function keysError({
  extra = [],
  missing = [],
  path = null
}: {
  extra?: string[];
  missing?: string[];
  path?: Option<string>;
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
  path: Option<string> = null
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
