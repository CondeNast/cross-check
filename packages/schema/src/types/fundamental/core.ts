import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import { dehydrated, resolved } from "../../descriptors";
import { Type } from "../../type";
import { maybe } from "../../utils";

export class OptionalityImpl implements Type {
  constructor(private type: Type, private args: resolved.OptionalityArgs) {}

  dehydrate(): dehydrated.Descriptor {
    return {
      ...this.type.dehydrate(),
      required: !this.args.isOptional
    };
  }

  validation(): ValidationBuilder<unknown> {
    if (this.isOptional) {
      return maybe(this.type.validation());
    } else {
      return validators.isPresent().andThen(this.type.validation());
    }
  }

  serialize(input: unknown): unknown {
    if (input === null) {
      assert(
        this.isOptional,
        "Serialization error: unexpected null (must validate before serializing)"
      );

      return input;
    } else {
      return this.type.serialize(input);
    }
  }

  parse(input: unknown): unknown {
    if (input === null) {
      assert(this.isOptional, "Parse error: unexpected null.");
      return null;
    } else {
      return this.type.parse(input);
    }
  }

  private get isOptional(): boolean {
    return this.args.isOptional;
  }
}

export function Optionality(
  inner: resolved.Descriptor,
  isOptional: boolean
): resolved.Optionality {
  return {
    type: "Optionality",
    args: { isOptional },
    inner
  };
}

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const ANY = builderFor(AnyValidator)();
