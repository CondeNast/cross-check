import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSONObject, unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { TypeBuilder } from "../../type";
import { ANY, AbstractType, Primitive, Refined } from "../fundamental";

export abstract class Scalar<Args> extends AbstractType<
  resolved.Primitive<Args>
  > {
  abstract validation(): ValidationBuilder<unknown>;

  protected get args(): Args {
    return this.descriptor.args;
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

export function Text(options?: TextOptions): TypeBuilder<builder.Primitive> {
  return Primitive(TextPrimitive, options);
}

class FloatPrimitive extends Scalar<undefined> {
  static description = "float";
  static typescript = "number";
  static typeName = "Float";

  validation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export function Float(): TypeBuilder {
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

export function Integer(): TypeBuilder {
  return Primitive(IntegerPrimitive);
}

class SingleLinePrimitive extends TextPrimitive {
  static base = Text;
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

export function SingleLine(options?: TextOptions): TypeBuilder {
  return Refined(SingleLinePrimitive, options);
}

class SingleWordPrimitive extends TextPrimitive {
  static base = Text;
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

export function SingleWord(options?: TextOptions): TypeBuilder {
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
export function Boolean(): TypeBuilder<builder.Primitive> {
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

export function Any(): TypeBuilder<builder.Primitive> {
  return Primitive(AnyPrimitive);
}
