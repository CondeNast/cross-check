import { ValidationError } from "@condenast/cross-check";

/// TODO: Extract into

export function typeError(kind: string, path: string | null): ValidationError {
  return {
    message: { details: kind, name: "type" },
    path: path ? path.split(".") : [],
  };
}

export function missingError(path: string): ValidationError {
  return typeError("present", path);
}

export function keysError({
  extra = [],
  missing = [],
  path = null,
}: {
  extra?: string[];
  missing?: string[];
  path?: string | null;
}): ValidationError {
  const errors = [];

  for (const m of missing) {
    errors.push(typeError("present", m));
  }

  for (const e of extra) {
    errors.push(typeError("absent", e));
  }

  return {
    message: { name: "keys", details: errors },
    path: path ? path.split(".") : [],
  };
}

export function error(
  kind: string,
  problem: unknown,
  path: string | null
): ValidationError {
  return {
    message: { details: problem, name: kind },
    path: path ? path.split(".") : [],
  };
}
