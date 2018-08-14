import { ValidationError } from "@cross-check/core";
import { Option } from "ts-std";

/// TODO: Extract into

export function typeError(kind: string, path: Option<string>): ValidationError {
  return {
    message: { details: kind, name: "type" },
    path: path ? path.split(".") : []
  };
}

export function missingError(path: string) {
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
  path: Option<string>
): ValidationError {
  return {
    message: { details: problem, name: kind },
    path: path ? path.split(".") : []
  };
}
