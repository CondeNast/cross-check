import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSONObject, unknown } from "ts-std";
import { builders, dehydrated } from "../../descriptors";
import { REGISTRY } from "../../registry";
import * as type from "../../type";
import { JSONValue } from "../../utils";
import { ANY } from "../fundamental";

export abstract class Scalar<Args extends JSONValue | undefined>
  implements type.Type {
  constructor(protected readonly args: Args, readonly name: string) {}

  abstract validation(): ValidationBuilder<unknown>;

  dehydrate(): dehydrated.Descriptor {
    return {
      type: "Primitive",
      name: this.name,
      args: this.args,
      required: true
    };
  }

  serialize(input: unknown): unknown {
    return input;
  }

  parse(input: unknown): unknown {
    return input;
  }
}

const notBlankString = validators.is(
  (value: string): value is string => value.length > 0,
  "present"
);

export function text(
  args: TextOptions | undefined
): ValidationBuilder<unknown> {
  let allowEmpty = args === undefined ? false : args.allowEmpty;

  if (allowEmpty) {
    return validators.isString();
  } else {
    return validators.isString().andThen(notBlankString());
  }
}

export function buildTextArgs(
  args: TextOptions | undefined,
  required: boolean
): TextOptions | undefined {
  if (required === false) {
    return {
      ...args,
      allowEmpty: true
    };
  } else {
    return args;
  }
}

export const Text = scalar("Text", {
  description: "string",
  typescript: "string",

  validation(args: TextOptions | undefined) {
    return text(args);
  },

  buildArgs: buildTextArgs
});

export interface TextOptions extends JSONObject {
  allowEmpty: boolean;
}

export const Float = scalar("Float", {
  description: "float",
  typescript: "number",

  validation() {
    return validators.isNumber();
  }
});

export const Integer = scalar("Integer", {
  description: "integer",
  typescript: "number",

  validation: validators
    .isNumber()
    .andThen(
      validators.is(
        (value: number): value is number => Number.isInteger(value),
        "number:integer"
      )()
    )
});

export const SingleLine = scalar("SingleLine", {
  description: "single line string",
  typescript: "string",
  base: "Text",

  validation(args?: TextOptions) {
    return text(args).andThen(
      validators.is(
        (value: string): value is string => !/\n/.test(value),
        "string:single-line"
      )()
    );
  },

  buildArgs: buildTextArgs
});

export const SingleWord = scalar("SingleWord", {
  description: "single word string",
  typescript: "string",
  base: "Text",

  validation(args: TextOptions | undefined) {
    return text(args).andThen(
      validators.is(
        (value: string): value is string => !/\s/.test(value),
        "string:single-word"
      )()
    );
  },

  buildArgs: buildTextArgs
});

// tslint:disable-next-line:variable-name
export const Boolean = scalar("Boolean", {
  description: "boolean",
  typescript: "boolean",

  validation() {
    return validators.isBoolean();
  }
});

export const Any = scalar("Any", {
  description: "any",
  typescript: "any",

  validation() {
    return ANY;
  }
});

export interface RegisterOptions {
  description: string;
  typescript: string;
  base?: string;
}

export interface RegisterOptionsWithArgs<Args> extends RegisterOptions {
  validation(args: Args): ValidationBuilder<unknown>;
  buildArgs?(args: any, required: boolean): any;
  serialize?(input: any): any;
  parse?(input: any): any;
}

export interface RegisterOptionsWithoutArgs extends RegisterOptions {
  validation: ValidationBuilder<unknown>;
}

interface AllRegisterOptions<Args> extends RegisterOptions {
  validation:
    | ValidationBuilder<unknown>
    | ((args: Args) => ValidationBuilder<unknown>);
  buildArgs?(args: any, required: boolean): any;
  serialize?(input: any): any;
  parse?(input: any): any;
}

// TODO: clean up anys
export function scalar<Args>(
  name: string,
  options: RegisterOptionsWithArgs<Args>
): (args?: Args) => builders.PrimitiveBuilder;
export function scalar<Args>(
  name: string,
  options: RegisterOptionsWithoutArgs
): () => builders.PrimitiveBuilder;
export function scalar<Args>(
  name: string,
  options: RegisterOptionsWithArgs<Args> | RegisterOptionsWithoutArgs
): (args?: any) => builders.PrimitiveBuilder;
export function scalar<Args>(
  name: string,
  options: AllRegisterOptions<Args>
): any {
  class Primitive extends Scalar<any> {
    validation() {
      if (typeof options.validation === "function") {
        return options.validation(this.args);
      } else {
        return options.validation!;
      }
    }

    serialize(input: any): any {
      if (options.serialize) {
        return options.serialize(input);
      } else {
        return input;
      }
    }

    parse(input: any): any {
      if (options.parse) {
        return options.parse(input);
      } else {
        return input;
      }
    }
  }

  function Factory(args: any): type.Type {
    return new Primitive(args, name);
  }

  let { description, typescript, base } = options;

  REGISTRY.setPrimitive(name, {
    name,
    description,
    typescript,
    base: base === undefined ? undefined : { name: base, args: undefined },
    factory: Factory,
    buildArgs: options.buildArgs
  });

  return (args: any) => {
    let primitive = REGISTRY.getPrimitive(name);

    return new builders.PrimitiveBuilder({
      name: primitive.name,
      args,
      base: primitive.base
    });
  };
}
