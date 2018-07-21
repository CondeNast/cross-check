import { Record } from "../../record";
import { JSONValue } from "../utils";
import { IteratorDescriptor, TypeDescriptor, factory } from "./descriptor";
import { ReferenceImpl } from "./reference";
import { TypeBuilder, required } from "./value";

export class IteratorImpl extends ReferenceImpl {
  static base(descriptor: IteratorDescriptor): TypeDescriptor {
    return {
      ...descriptor,
      inner: required(descriptor.inner, false)
    };
  }

  constructor(readonly descriptor: IteratorDescriptor) {
    super(descriptor);
  }
}

export function hasMany(item: Record, options: JSONValue = null): TypeBuilder {
  return new TypeBuilder({
    type: "Iterator",
    factory: factory(IteratorImpl),
    description: "hasMany",
    inner: item.descriptor,
    args: null,
    metadata: options,
    name: "hasMany"
  });
}
