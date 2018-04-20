import { Dict, Option, entries, unknown } from "ts-std";
import { ValidationDescriptor } from "./descriptor";

type PrimitiveOptions =
  | ValidationDescriptor
  | string
  | number
  | boolean
  | RegExp
  // tslint:disable-next-line:ban-types
  | Function
  | null
  | undefined;

interface OptionsArray extends Array<PrimitiveOptions> {}
interface OptionsDict extends Dict<Options> {}

type Options = PrimitiveOptions | OptionsArray | OptionsDict;

export function format(
  descriptor: ValidationDescriptor,
  top: boolean = true
): string {
  let out = `(${descriptor.name}`;
  let options = formatOption(descriptor.options, top);

  if (options !== null) {
    return `${out} ${options})`;
  } else {
    return `${out})`;
  }
}

function formatOption(option: unknown, top: boolean): Option<string> {
  switch (optionType(option)) {
    case "String":
    case "Boolean":
    case "Number":
    case "Null":
      return top ? null : JSON.stringify(option);
    case "Undefined":
      return top ? null : "undefined";
    case "Array":
      return castOption<"Array">(option)
        .map(o => formatOption(o, false))
        .join(" ");
    case "RegExp":
      return String(option);
    case "Dictionary": {
      let out = [];

      for (let [key, value] of entries(castOption<"Dictionary">(option))) {
        out.push(`${key}=${formatOption(value, false)}`);
      }

      return out.length === 0 ? "{}" : out.join(" ");
    }
    case "Descriptor":
      return format(castOption<"Descriptor">(option));
    case "Function":
      return `function() { ... }`;
    case "Class": {
      let c = castOption<"Class">(option);

      if (c.name) {
        return `class ${c.name} { ... }`;
      } else {
        return `class { ... }`;
      }
    }
    case "None":
      return "[unexpected]";
  }
}

interface OptionType {
  String: string;
  Number: number;
  Boolean: boolean;
  RegExp: RegExp;
  Null: null;
  Undefined: undefined;
  Array: Options[];
  Dictionary: Dict<Options>;
  // tslint:disable-next-line:ban-types
  Function: Function;
  Class: typeof Object;
  Descriptor: ValidationDescriptor;
  None: unknown;
}

function castOption<K extends keyof OptionType>(
  option: unknown
): OptionType[K] {
  return option as OptionType[K];
}

function optionType(option: unknown): keyof OptionType {
  if (Array.isArray(option)) {
    return "Array";
  } else if (option === null) {
    return "Null";
  } else if (option instanceof RegExp) {
    return "RegExp";
  }

  switch (typeof option) {
    case "string":
      return "String";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
    case "undefined":
      return "Undefined";
    case "function": {
      if (String(option).indexOf("class") === 0) {
        return "Class";
      } else {
        return "Function";
      }
    }
    case "object":
      return objectOptionType(option as object);
    default:
      return "None";
  }
}

function objectOptionType(option: object): keyof OptionType {
  if (isValidationDescriptor(option)) {
    return "Descriptor";
  } else if (Object.getPrototypeOf(option) === Object.prototype) {
    return "Dictionary";
  } else {
    return "None";
  }
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
