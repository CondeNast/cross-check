import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { Label, label } from "../describe/label";
import { PrimitiveDescriptor } from "../fundamental/descriptor";
import {
  AbstractType,
  Type,
  parse,
  serialize,
  validationFor
} from "../fundamental/value";
import { basic } from "../type";

export abstract class Scalar extends AbstractType {
  readonly base = this;
  readonly args = null;

  constructor(descriptor: PrimitiveDescriptor) {
    super(descriptor);
  }

  abstract get label(): Label;

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

export abstract class Opaque extends AbstractType {
  readonly args = null;
  abstract readonly base: Type;

  constructor(descriptor: PrimitiveDescriptor) {
    super(descriptor);
  }

  abstract get label(): Label;

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
  name = "Text";

  get label(): Label {
    return label({
      name: "Text",
      description: "string",
      typescript: "string"
    });
  }

  baseValidation(): ValidationBuilder<unknown> {
    return validators.isString();
  }
}

export const Text: () => Type = basic(TextPrimitive);

class FloatPrimitive extends Scalar {
  name = "Float";

  get label(): Label {
    return label({
      name: "Float",
      description: "float",
      typescript: "number"
    });
  }

  baseValidation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }
}

export const Float = basic(FloatPrimitive);

class IntegerPrimitive extends Scalar {
  name = "Integer";

  get label(): Label {
    return label({
      name: "Integer",
      typescript: "number",
      description: "integer"
    });
  }

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

export const Integer = basic(IntegerPrimitive);

class SingleLinePrimitive extends Opaque {
  name = "SingleLine";

  readonly base = Text();

  get label(): Label {
    return label({
      name: "SingleLine",
      typescript: "string",
      description: "single line string"
    });
  }

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

export const SingleLine = basic(SingleLinePrimitive);

class SingleWordPrimitive extends Opaque {
  readonly name = "SingleWord";
  readonly base = Text();

  get label(): Label {
    return label({
      name: "SingleWord",
      description: "single word string",
      typescript: "string"
    });
  }

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

export const SingleWord = basic(SingleWordPrimitive);

class BooleanPrimitive extends Scalar {
  readonly name = "Boolean";

  get label(): Label {
    return label({
      name: "Boolean",
      typescript: "boolean"
    });
  }

  baseValidation(): ValidationBuilder<unknown> {
    return validators.isBoolean();
  }
}

// tslint:disable-next-line:variable-name
export const Boolean = basic(BooleanPrimitive);

class AnyPrimitive extends Scalar {
  readonly name = "Any";

  get label(): Label {
    return label({
      name: "Any",
      typescript: "unknown",
      description: "any"
    });
  }

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

export const Any = basic(AnyPrimitive);
export const ANY = builderFor(AnyValidator)();
