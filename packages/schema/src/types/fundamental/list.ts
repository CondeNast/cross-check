import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { Label, typeNameOf } from "../label";
import { maybe } from "../utils";
import { Type, parse, serialize } from "./value";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

class ArrayImpl implements Type {
  constructor(
    private itemType: Type,
    private name: string | undefined,
    readonly isRequired: boolean
  ) {}

  get base(): Type {
    return new ArrayImpl(this.itemType.base, undefined, false);
  }

  get label(): Label {
    let inner = this.itemType.required();

    return {
      type: {
        kind: "list",
        of: inner
      },
      name: this.name,
      description: `hasOne ${typeNameOf(inner.label.name)}`
    };
  }

  required(isRequired = true): Type {
    return new ArrayImpl(this.itemType, this.name, isRequired);
  }

  named(arg: Option<string>): Type {
    return new ArrayImpl(
      this.itemType,
      arg === null ? undefined : arg,
      this.isRequired
    );
  }

  serialize(js: any[]): any {
    let itemType = this.itemType;

    return serialize(js, !this.isRequired, () =>
      js.map(item => itemType.serialize(item))
    );
  }

  parse(wire: any[]): any {
    let itemType = this.itemType;

    return parse(wire, !this.isRequired, () =>
      wire.map(item => itemType.parse(item))
    );
  }

  validation(): ValidationBuilder<unknown> {
    let validator = validators.array(this.itemType.validation());
    if (this.isRequired) {
      return validators
        .isPresent()
        .andThen(validator)
        .andThen(isPresentArray());
    } else {
      return maybe(validator);
    }
  }
}

export function List(item: Type): Type {
  return new ArrayImpl(item, undefined, false);
}
