import { Record } from "../../record";
import { JSONValue } from "../utils";
import { IteratorDescriptor } from "./descriptor";
import { ReferenceImpl } from "./reference";
import { TypeBuilder } from "./value";

export class IteratorImpl extends ReferenceImpl {
  constructor(readonly descriptor: IteratorDescriptor) {
    super(descriptor);
  }

  get base(): TypeBuilder {
    return new IteratorImpl({
      ...this.descriptor,
      inner: this.type.base.required(false)
    });
  }
}

export function hasMany(item: Record, options: JSONValue = null): TypeBuilder {
  return new IteratorImpl({
    type: "Iterator",
    factory: (descriptor: IteratorDescriptor) => new IteratorImpl(descriptor),
    description: "hasMany",
    inner: item,
    args: null,
    metadata: options,
    name: "hasMany"
  });
}
