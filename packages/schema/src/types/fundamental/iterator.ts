import { resolved, unresolved } from "../../descriptors";
import { Record } from "../../record";
import { JSONValue } from "../../utils";
import { TypeBuilder } from "./core";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl<resolved.Iterator> {}

export function hasMany(item: Record, options: JSONValue = null): TypeBuilder {
  return new TypeBuilder(
    unresolved.Iterator({
      name: "hasMany",
      metadata: options,
      inner: item.descriptor,
      args: null,
      impl: IteratorImpl
    })
  );
}
