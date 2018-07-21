import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { PrimitiveDescriptor } from "../fundamental/descriptor";
import { AbstractType, Type, base, instantiate } from "../fundamental/value";
import { TypeConstructor, primitive } from "../type";

export abstract class Scalar extends AbstractType<PrimitiveDescriptor> {
  constructor(descriptor: PrimitiveDescriptor) {
    super(descriptor);
  }

  abstract validation(): ValidationBuilder<unknown>;

  serialize(input: unknown): unknown {
    return input;
  }

  parse(input: unknown): unknown {
    return input;
  }
}

export abstract class Opaque extends AbstractType<PrimitiveDescriptor> {
  get base(): Type {
    return instantiate(base(this.descriptor));
  }

  constructor(descriptor: PrimitiveDescriptor) {
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

class TextPrimitive extends Scalar {
  static description = "string";
  static typescript = "string";
  static typeName = "Text";

  validation(): ValidationBuilder<unknown> {
    return validators.isString();
  }
}

export const Text: TypeConstructor = primitive(TextPrimitive);

class FloatPrimitive extends Scalar {
  static description = "float";
  static typescript = "number";
  static typeName = "Float";

  validation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export const Float: TypeConstructor = primitive(FloatPrimitive);

class IntegerPrimitive extends Scalar {
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

class SingleLinePrimitive extends Opaque {
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

class SingleWordPrimitive extends Opaque {
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

class BooleanPrimitive extends Scalar {
  static typeName = "Boolean";
  static typescript = "boolean";
  static description = "boolean";

  validation(): ValidationBuilder<unknown> {
    return validators.isBoolean();
  }
}

// tslint:disable-next-line:variable-name
export const Boolean: TypeConstructor = primitive(BooleanPrimitive);

class AnyPrimitive extends Scalar {
  static description = "any";
  static typescript = "any";
  static typeName = "Any";

  validation(): ValidationBuilder<unknown> {
    return builderFor(AnyValidator)();
  }
}

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const Any: TypeConstructor = primitive(AnyPrimitive);
export const ANY = builderFor(AnyValidator)();
