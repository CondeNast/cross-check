import { resolved, unresolved } from "../../descriptors";
import { Record } from "../../record";
import { JSONValue } from "../../utils";
import { TypeBuilder } from "./core";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl<resolved.Pointer> {}

export function hasOne(entity: Record, options: JSONValue = null): TypeBuilder {
  return new TypeBuilder(
    unresolved.Pointer({
      name: "hasOne",
      metadata: null,
      args: options,
      inner: unresolved.Alias(entity.descriptor, entity.name),
      impl: PointerImpl
    })
  );
}
