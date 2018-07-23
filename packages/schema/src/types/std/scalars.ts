import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSONObject, unknown } from "ts-std";
import { PrimitiveDescriptor } from "../../descriptors";
import { JSONValue } from "../../utils";
import { ANY, AbstractType, Type, base, instantiate } from "../fundamental";
import { Primitive, TypeConstructor, primitive } from "../type";

export abstract class Scalar<
  Args extends JSONValue | undefined
> extends AbstractType<PrimitiveDescriptor<Args>> {
  constructor(descriptor: PrimitiveDescriptor<Args>) {
    super(descriptor);
  }

  abstract validation(): ValidationBuilder<unknown>;

  protected get args(): this["descriptor"]["args"] {
    return this.descriptor.args;
  }

  serialize(input: unknown): unknown {
    return input;
  }

  parse(input: unknown): unknown {
    return input;
  }
}

export abstract class Opaque<
  Args extends JSONValue | undefined
> extends AbstractType<PrimitiveDescriptor<Args>> {
  get base(): Type {
    return instantiate(base(this.descriptor));
  }

  constructor(descriptor: PrimitiveDescriptor<Args>) {
    super(descriptor);
  }

  abstract validation(): ValidationBuilder<unknown>;

  serialize(input: unknown): unknown {
    return this.base.serialize(input);
  }

  parse(input: unknown): unknown {
    return this.base.parse(input);
  }
}

class TextPrimitive extends Scalar<TextOptions | undefined> {
  static description = "string";
  static typescript = "string";
  static typeName = "Text";

  validation(): ValidationBuilder<unknown> {
    return validators.isString();
  }
}

export interface TextOptions extends JSONObject {
  allowEmpty: boolean;
}

export const Text: Primitive<TextOptions | undefined> = primitive(
  TextPrimitive
);

class FloatPrimitive extends Scalar<undefined> {
  static description = "float";
  static typescript = "number";
  static typeName = "Float";

  validation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export const Float: TypeConstructor = primitive(FloatPrimitive);

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

export const Integer: TypeConstructor = primitive(IntegerPrimitive);

class SingleLinePrimitive extends Opaque<TextOptions | undefined> {
  static base = Text();
  static description = "single line string";
  static typescript = "string";
  static typeName = "SingleLine";

  validation(): ValidationBuilder<unknown> {
    return this.base
      .validation()
      .andThen(
        validators.is(
          (value: string): value is string => !/\n/.test(value),
          "string:single-line"
        )()
      );
  }
}

export const SingleLine: TypeConstructor = primitive(SingleLinePrimitive);

class SingleWordPrimitive extends Opaque<TextOptions | undefined> {
  static base = Text();
  static description = "single word string";
  static typescript = "string";
  static typeName = "SingleWord";

  validation(): ValidationBuilder<unknown> {
    return this.base
      .validation()
      .andThen(
        validators.is(
          (value: string): value is string => !/\s/.test(value),
          "string:single-word"
        )()
      );
  }
}

export const SingleWord: TypeConstructor = primitive(SingleWordPrimitive);

class BooleanPrimitive extends Scalar<undefined> {
  static typeName = "Boolean";
  static typescript = "boolean";
  static description = "boolean";

  validation(): ValidationBuilder<unknown> {
    return validators.isBoolean();
  }
}

// tslint:disable-next-line:variable-name
export const Boolean: TypeConstructor = primitive(BooleanPrimitive);

class AnyPrimitive extends Scalar<undefined> {
  static description = "any";
  static typescript = "any";
  static typeName = "Any";

  validation(): ValidationBuilder<unknown> {
    return ANY;
  }
}

export const Any: TypeConstructor = primitive(AnyPrimitive);
