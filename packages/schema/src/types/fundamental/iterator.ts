import { Record } from "../../record";
import { JSONValue } from "../utils";
import { IteratorDescriptor } from "./descriptor";
import { ReferenceImpl } from "./reference";
import { Alias, Type } from "./value";

export class IteratorImpl extends ReferenceImpl {
  constructor(readonly descriptor: IteratorDescriptor) {
    super(descriptor);
  }

  get base(): Type {
    return new IteratorImpl({
      ...this.descriptor,
      args: this.type.base
    });
  }
}

export function hasMany(item: Record, options: JSONValue = null): Type {
  return new IteratorImpl({
    type: "Iterator",
    description: "hasMany",
    args: Alias(item.name, item),
    metadata: options,
    name: "hasMany",
    required: false,
    features: []
  });
}
