import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { PrimitiveDescriptor } from "../fundamental/descriptor";
import {
  AbstractType,
  Type,
  parse,
  serialize,
  validationFor
} from "../fundamental/value";
import { PrimitiveConstructor, basic } from "../type";

export abstract class Scalar extends AbstractType<PrimitiveDescriptor> {
  readonly base = this;

  constructor(descriptor: PrimitiveDescriptor) {
    super(descriptor);
  }

  validation(): ValidationBuilder<unknown> {
    return validationFor(this.baseValidation(), this.isRequired);
  }

  abstract baseValidation(): ValidationBuilder<unknown>;

  serialize(input: unknown): unknown {
    return serialize(input, !this.isRequired, value =>
      this.baseSerialize(value)
    );
  }

  baseSerialize(input: unknown): unknown {
    return input;
  }

  parse(input: unknown): unknown {
    return parse(input, !this.isRequired, value => this.baseParse(value));
  }

  baseParse(input: unknown): unknown {
    return input;
  }
}

export abstract class Opaque extends AbstractType<PrimitiveDescriptor> {
  abstract readonly base: Type<PrimitiveDescriptor>;

  constructor(descriptor: PrimitiveDescriptor) {
    super(descriptor);
  }

  validation(): ValidationBuilder<unknown> {
    return validationFor(this.baseValidation(), this.isRequired);
  }

  abstract baseValidation(): ValidationBuilder<unknown>;

  serialize(input: unknown): unknown {
    return serialize(input, !this.isRequired, () => this.baseSerialize(input));
  }

  baseSerialize(input: unknown): unknown {
    return this.base.serialize(input);
  }

  parse(input: unknown): unknown {
    return parse(input, !this.isRequired, () => this.baseParse(input));
  }

  baseParse(input: unknown): unknown {
    return this.base.parse(input);
  }
}

class TextPrimitive extends Scalar {
  baseValidation(): ValidationBuilder<unknown> {
    return validators.isString();
  }
}

export const Text: PrimitiveConstructor = basic(
  "Text",
  TextPrimitive,
  "string",
  "string"
);

class FloatPrimitive extends Scalar {
  baseValidation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export const Float: PrimitiveConstructor = basic(
  "Float",
  FloatPrimitive,
  "number",
  "float"
);

class IntegerPrimitive extends Scalar {
  baseValidation(): ValidationBuilder<unknown> {
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

export const Integer: PrimitiveConstructor = basic(
  "Integer",
  IntegerPrimitive,
  "number",
  "integer"
);

class SingleLinePrimitive extends Opaque {
  name = "SingleLine";

  readonly base = Text();

  baseValidation(): ValidationBuilder<unknown> {
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

export const SingleLine: PrimitiveConstructor = basic(
  "SingleLine",
  SingleLinePrimitive,
  "string",
  "single line string"
);

class SingleWordPrimitive extends Opaque {
  readonly base = Text();

  baseValidation(): ValidationBuilder<unknown> {
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

export const SingleWord: PrimitiveConstructor = basic(
  "SingleWord",
  SingleWordPrimitive,
  "string",
  "single word string"
);

class BooleanPrimitive extends Scalar {
  readonly name = "Boolean";

  baseValidation(): ValidationBuilder<unknown> {
    return validators.isBoolean();
  }
}

// tslint:disable-next-line:variable-name
export const Boolean: PrimitiveConstructor = basic(
  "Boolean",
  BooleanPrimitive,
  "boolean",
  "boolean"
);

class AnyPrimitive extends Scalar {
  readonly name = "Any";

  baseValidation(): ValidationBuilder<unknown> {
    return builderFor(AnyValidator)();
  }
}

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const Any: PrimitiveConstructor = basic(
  "Any",
  AnyPrimitive,
  "any",
  "any"
);
export const ANY = builderFor(AnyValidator)();
