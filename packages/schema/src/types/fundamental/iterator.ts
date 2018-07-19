import { Record } from "../../record";
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
      inner: this.type.base.required(false)
    });
  }
}

export function hasMany(item: Record, options: JSONValue = null): Type {
  return new IteratorImpl({
    type: "Iterator",
    description: "hasMany",
    inner: item,
    args: null,
    metadata: options,
    name: "hasMany"
  });
}
