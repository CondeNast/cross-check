import { Dict, Option, entries } from "ts-std";
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

export function format(descriptor: ValidationDescriptor<any, any>): string {
  let out = `(${descriptor.name}`;
  let options = formatOption(descriptor.options, Position.Top);

  if (options !== null) {
    out = `${out} ${options})`;
  } else {
    out = `${out})`;
  }

  if (descriptor.contexts && descriptor.contexts.length) {
    out += `::on(${descriptor.contexts.join(" ")})`;
  }

  return out;
}

export enum Position {
  Top,
  InArray,
  InDictionary
}

function formatOption(option: unknown, position: Position): Option<string> {
  switch (optionType(option)) {
    case "String":
    case "Boolean":
    case "Number":
    case "Null":
      return position === Position.Top ? null : JSON.stringify(option);
    case "Undefined":
      return position === Position.Top ? null : "undefined";
    case "Array": {
      let items = castOption<"Array">(option).map(o =>
        formatOption(o, Position.InArray)
      );

      switch (position) {
        case Position.Top:
          return items.join(" ");
        default:
          return `[${items.join(", ")}]`;
      }
    }
    case "RegExp":
      return String(option);
    case "Dictionary":
    case "DescriptorDict": {
      let out = [];

      for (let [key, value] of entries(castOption<"Dictionary">(option))) {
        out.push(`${key}=${formatOption(value, Position.InDictionary)}`);
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
      return "[unknown]";
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
  DescriptorDict: Dict<ValidationDescriptor>;
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
  } else if (isPlainObject(option)) {
    return "Dictionary";
  } else {
    return "None";
  }
}

function isPlainObject(obj: object): boolean {
  let proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

function isValidationDescriptor(
  option: Partial<ValidationDescriptor>
): option is ValidationDescriptor {
  return (
    typeof (option as Partial<ValidationDescriptor>).validator === "function" &&
    typeof (option as Partial<ValidationDescriptor>).name === "string" &&
    "options" in option
  );
}
