import { IteratorLabel, Label, typeNameOf } from "../label";
import { JSONValue } from "../utils";
import { IteratorDescriptor } from "./descriptor";
import { ReferenceImpl } from "./reference";
import { Type } from "./value";

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

  get label(): Label<IteratorLabel> {
    let inner = this.type.required();

    return {
      type: {
        kind: "iterator",
        of: inner
      },
      args: this.descriptor.metadata,
      description: `hasMany ${typeNameOf(inner.label.name)}`,
      name: "hasMany"
    };
  }
}

export function hasMany(item: Type, options: JSONValue = null): Type {
  return new IteratorImpl({
    type: "Iterator",
    args: item,
    metadata: options,
    name: null,
    required: false,
    features: []
  });
  // return new IteratorImpl(item, undefined, options, false);
}
