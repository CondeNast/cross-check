import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSONObject, unknown } from "ts-std";
import { PrimitiveDescriptor, TypeDescriptor } from "../../descriptors";
import { JSONValue } from "../../utils";
import { ANY, AbstractType } from "../fundamental";
import { PrimitiveConstructor, TypeConstructor, primitive } from "../type";

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

// export abstract class Opaque<
//   Args extends JSONValue | undefined
// > extends AbstractType<PrimitiveDescriptor<Args>> {
//   static base(
//     descriptor: PrimitiveDescriptor<JSONValue | undefined>
//   ): TypeDescriptor {
//     let basePrimitive = instantiate(descriptor).base;

//     if (typeof basePrimitive === "function") {
//       return basePrimitive(descriptor.args).descriptor;
//     } else {
//       return basePrimitive.descriptor;
//     }
//   }

//   abstract base: PrimitiveConstructor<Args> | TypeBuilder;

//   constructor(descriptor: PrimitiveDescriptor<Args>) {
//     super(descriptor);
//   }

//   validation(): ValidationBuilder<unknown> {
//     return instantiate(base(this.descriptor)).validation();
//   }

//   serialize(input: unknown): unknown {
//     return instantiate(base(this.descriptor)).serialize(input);
//   }

//   parse(input: unknown): unknown {
//     return instantiate(base(this.descriptor)).parse(input);
//   }
// }

const notBlankString = validators.is(
  (value: string): value is string => value.length > 0,
  "present"
);

export class TextPrimitive extends Scalar<TextOptions | undefined> {
  static description = "string";
  static typescript = "string";
  static typeName = "Text";

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

export const Text: PrimitiveConstructor<TextOptions | undefined> = primitive(
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

export const Float: PrimitiveConstructor<undefined> = primitive(FloatPrimitive);

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

export const Integer: PrimitiveConstructor<undefined> = primitive(
  IntegerPrimitive
);

class SingleLinePrimitive extends TextPrimitive {
  static description = "single line string";
  static typescript = "string";
  static typeName = "SingleLine";

  static base(
    descriptor: PrimitiveDescriptor<TextOptions | undefined>
  ): TypeDescriptor {
    return Text(descriptor.args).descriptor;
  }

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

export const SingleLine: PrimitiveConstructor<
  TextOptions | undefined
> = primitive(SingleLinePrimitive);

class SingleWordPrimitive extends TextPrimitive {
  static description = "single word string";
  static typescript = "string";
  static typeName = "SingleWord";

  static base(
    descriptor: PrimitiveDescriptor<TextOptions | undefined>
  ): TypeDescriptor {
    return Text(descriptor.args).descriptor;
  }

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

export const SingleWord: PrimitiveConstructor<
  TextOptions | undefined
> = primitive(SingleWordPrimitive);

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
