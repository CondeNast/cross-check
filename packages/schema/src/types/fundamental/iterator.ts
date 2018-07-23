import { IteratorDescriptor, TypeDescriptor, factory } from "../../descriptors";
import { Record } from "../../record";
import { JSONValue } from "../../utils";
import { TypeBuilder, required } from "./core";
import { ReferenceImpl } from "./reference";

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
