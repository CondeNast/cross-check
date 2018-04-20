import { Dict, Option, entries, unknown, values } from "ts-std";
import { ValidationDescriptor } from "./descriptor";

type PrimitiveOptions =
  | ValidationDescriptor
  | string
  | number
  | boolean
  | RegExp
  | null
  | undefined;

interface OptionsArray extends Array<PrimitiveOptions> {}
interface OptionsDict extends Dict<Options> {}

type Options = PrimitiveOptions | OptionsArray | OptionsDict;

export function format(descriptor: ValidationDescriptor): string {
  let out = `(${descriptor.name}`;
  let options = formatOption(descriptor.options);

  if (options !== null) {
    return `${out} ${options})`;
  } else {
    return `${out})`;
  }
}

function formatOption(unknownOption: unknown): Option<string> {
  let option = toOption(unknownOption);

  if (
    typeof option === "string" ||
    typeof option === "number" ||
    typeof option === "boolean"
  ) {
    return JSON.stringify(option);
  } else if (option instanceof RegExp) {
    return String(option);
  } else if (option === null || option === undefined) {
    return null;
  } else if (Array.isArray(option)) {
    return option.map(formatOption).join(" ");
  } else if (typeof option === "object") {
    if (isValidationDescriptor(option)) {
      return format(option);
    }

    let out = [];

    for (let [key, value] of entries(option)) {
      out.push(`${key}=${formatOption(value)}`);
    }

    return out.join(" ");
  } else {
    throw new Error("Unreachable");
  }
}

function toOption(option: unknown): Options {
  if (isOption(option)) {
    return option;
  } else {
    return String(option);
  }
}

function isOption(option: unknown): option is Options {
  if (
    typeof option === "string" ||
    typeof option === "number" ||
    typeof option === "boolean"
  ) {
    return true;
  } else if (option instanceof RegExp) {
    return true;
  } else if (option === null) {
    return true;
  } else if (Array.isArray(option)) {
    return option.every(isOption);
  } else if (typeof option === "object") {
    if (isValidationDescriptor(option)) {
      return true;
    }

    for (let value of values(option)) {
      if (!isOption(value)) {
        return false;
      }
    }

    return true;
  }

  return false;
}

function isValidationDescriptor(
  option: Partial<ValidationDescriptor>
): option is ValidationDescriptor {
  return (
    typeof (option as Partial<ValidationDescriptor>).factory === "function" &&
    typeof (option as Partial<ValidationDescriptor>).name === "string" &&
    "options" in option
  );
}
