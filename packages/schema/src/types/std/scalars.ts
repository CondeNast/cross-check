import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSONObject, unknown } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { PrimitiveRegistration, REGISTRY, Registry } from "../../descriptors/registered";
import { JSONValue } from "../../utils";
import { ANY, AbstractType, Primitive, PrimitiveClass, PrimitiveWithOptions } from "../fundamental";

export abstract class Scalar<Args> {
  constructor(protected readonly args: Args) { }

  abstract validation(): ValidationBuilder<unknown>;

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

export class TextPrimitive extends Scalar<TextOptions | undefined> {
  static description = "string";
  static typescript = "string";
  static typeName = "Text";

  static buildArgs(
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

  validation(): ValidationBuilder<unknown> {
    let allowEmpty = this.args === undefined ? false : this.args.allowEmpty;

    if (allowEmpty) {
      return validators.isString();
    } else {
      return validators.isString().andThen(notBlankString());
    }
  }
}

export interface TextOptions extends JSONObject {
  allowEmpty: boolean;
}

export function Text(options?: TextOptions): registered.Primitive {
  return PrimitiveWithOptions(TextPrimitive, options);
}

class FloatPrimitive extends Scalar<undefined> {
  static description = "float";
  static typescript = "number";
  static typeName = "Float";

  validation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export function Float(): registered.Primitive {
  return Primitive(FloatPrimitive);
}

class IntegerPrimitive extends Scalar<undefined> {
  static description = "integer";
  static typescript = "number";
  static typeName = "Integer";

  validation(): ValidationBuilder<unknown> {
    return validators
      .isNumber()
      .andThen(
        validators.is(
          (value: number): value is number => Number.isInteger(value),
          "number:integer"
        )()
      );
  }
}

export function Integer(): registered.Primitive {
  return Primitive(IntegerPrimitive);
}

class SingleLinePrimitive extends TextPrimitive {
  static base = TextPrimitive;
  static description = "single line string";
  static typescript = "string";
  static typeName = "SingleLine";

  validation(): ValidationBuilder<unknown> {
    return super
      .validation()
      .andThen(
        validators.is(
          (value: string): value is string => !/\n/.test(value),
          "string:single-line"
        )()
      );
  }
}

export function SingleLine(options?: TextOptions): registered.Primitive {
  return Refined(SingleLinePrimitive, options);
}

class SingleWordPrimitive extends TextPrimitive {
  static base = TextPrimitive;
  static description = "single word string";
  static typescript = "string";
  static typeName = "SingleWord";

  validation(): ValidationBuilder<unknown> {
    return super
      .validation()
      .andThen(
        validators.is(
          (value: string): value is string => !/\s/.test(value),
          "string:single-word"
        )()
      );
  }
}

export function SingleWord(options?: TextOptions): registered.Primitive {
  return Refined(SingleWordPrimitive, options);
}

class BooleanPrimitive extends Scalar<undefined> {
  static typeName = "Boolean";
  static typescript = "boolean";
  static description = "boolean";

  validation(): ValidationBuilder<unknown> {
    return validators.isBoolean();
  }
}

// tslint:disable-next-line:variable-name
export function Boolean(): registered.Primitive {
  return Primitive(BooleanPrimitive);
}

class AnyPrimitive extends Scalar<undefined> {
  static description = "any";
  static typescript = "any";
  static typeName = "Any";

  validation(): ValidationBuilder<unknown> {
    return ANY;
  }
}

export function Any(): registered.Primitive {
  return Primitive(AnyPrimitive);
}

export function bootstrap(registry: Registry = REGISTRY): Registry {
  registry.setPrimitive("Text", registration(TextPrimitive));
  registry.setPrimitive("SingleLine", registration(SingleLinePrimitive), registration(SingleLinePrimitive.base));
  registry.setPrimitive("SingleWord", registration(SingleWordPrimitive), registration(SingleWordPrimitive.base));
  registry.setPrimitive("Float", registration(FloatPrimitive));
  registry.setPrimitive("Integer", registration(IntegerPrimitive));
  registry.setPrimitive("Boolean", registration(BooleanPrimitive));
  registry.setPrimitive("Any", registration(AnyPrimitive));

  return registry;
}

function registration<Args extends JSONValue | undefined>(Class: PrimitiveClass<Args>): PrimitiveRegistration {
  return {
    name: Class.typeName,
    description: Class.description,
    typescript: Class.typescript,
    factory: (args: Args) => new Class(args)
  } as PrimitiveRegistration;
  // This loses the connection between the type and args
  // TODO: Is there anything to do about it?
}
