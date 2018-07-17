import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { PrimitiveDescriptor } from "../fundamental/descriptor";
import { AbstractType, Type } from "../fundamental/value";
import { TypeConstructor, basic } from "../type";

export abstract class Scalar extends AbstractType<PrimitiveDescriptor> {
  readonly base = this;

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
  abstract readonly base: Type;

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
  validation(): ValidationBuilder<unknown> {
    return validators.isString();
  }
}

export const Text: TypeConstructor = basic(
  "Text",
  TextPrimitive,
  "string",
  "string"
);

class FloatPrimitive extends Scalar {
  validation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export const Float: TypeConstructor = basic(
  "Float",
  FloatPrimitive,
  "number",
  "float"
);

class IntegerPrimitive extends Scalar {
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

export const Integer: TypeConstructor = basic(
  "Integer",
  IntegerPrimitive,
  "number",
  "integer"
);

class SingleLinePrimitive extends Opaque {
  readonly base = Text();

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

export const SingleLine: TypeConstructor = basic(
  "SingleLine",
  SingleLinePrimitive,
  "string",
  "single line string"
);

class SingleWordPrimitive extends Opaque {
  readonly base = Text();

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

export const SingleWord: TypeConstructor = basic(
  "SingleWord",
  SingleWordPrimitive,
  "string",
  "single word string"
);

class BooleanPrimitive extends Scalar {
  validation(): ValidationBuilder<unknown> {
    return validators.isBoolean();
  }
}

// tslint:disable-next-line:variable-name
export const Boolean: TypeConstructor = basic(
  "Boolean",
  BooleanPrimitive,
  "boolean",
  "boolean"
);

class AnyPrimitive extends Scalar {
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

export const Any: TypeConstructor = basic("Any", AnyPrimitive, "any", "any");
export const ANY = builderFor(AnyValidator)();
