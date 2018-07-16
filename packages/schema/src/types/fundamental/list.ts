import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { ListDescriptor } from "./descriptor";
import { AbstractType, Type } from "./value";

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

    return js.map(item => itemType.serialize(item));
  }

  parse(wire: any[]): any {
    let itemType = this.type;

    return wire.map(item => itemType.parse(item));
  }

  validation(requiredHint: boolean): ValidationBuilder<unknown> {
    let validation = validators.array(this.type.validation(true));

    if (requiredHint) {
      return validation.andThen(isPresentArray());
    } else {
      return validation;
    }
  }
}

export function List(item: Type): Type {
  return new ArrayImpl({
    type: "List",
    description: `List of ${item.descriptor.name || "anonymous"}`,
    args: item.required(),
    metadata: null,
    name: null,
    features: []
  }).required(false);
}
