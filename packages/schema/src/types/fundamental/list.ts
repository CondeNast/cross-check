import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { maybe } from "../utils";
import { ListDescriptor } from "./descriptor";
import { AbstractType, Alias, Type, parse, serialize } from "./value";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

class ArrayImpl extends AbstractType {
  constructor(readonly descriptor: ListDescriptor) {
    super(descriptor);
  }

  get type(): Type {
    return this.descriptor.args;
  }

  get base(): Type {
    return new ArrayImpl({
      ...this.descriptor,
      args: this.type.base.required()
    });
  }

  serialize(js: any[]): any {
    let itemType = this.type;

    return serialize(js, !this.isRequired, () =>
      js.map(item => itemType.serialize(item))
    );
  }

  parse(wire: any[]): any {
    let itemType = this.type;

    return parse(wire, !this.isRequired, () =>
      wire.map(item => itemType.parse(item))
    );
  }

  validation(): ValidationBuilder<unknown> {
    let validator = validators.array(this.type.validation());
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
  return new ArrayImpl({
    type: "List",
    description: `List of ${item.descriptor.name || "anonymous"}`,
    args: listType(item).required(),
    metadata: null,
    name: null,
    required: false,
    features: []
  });
}

function listType(item: Type): Type {
  if (item.descriptor.type === "Record") {
    return Alias(item.descriptor.name, item);
  }

  return item;
}
