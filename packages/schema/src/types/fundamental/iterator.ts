import { IteratorDescriptor, factory } from "../../descriptors";
import { Record } from "../../record";
import { JSONValue } from "../../utils";
import { TypeBuilder, buildType } from "./core";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
  static base(descriptor: IteratorDescriptor): IteratorDescriptor {
    return {
      ...descriptor,
      inner: descriptor.inner
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
    inner: buildType(item.descriptor, { position: "Iterator" }),
    args: null,
    metadata: options,
    name: "hasMany"
  } as IteratorDescriptor);
}
