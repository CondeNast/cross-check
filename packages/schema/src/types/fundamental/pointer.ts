import { builder, resolved } from "../../descriptors";
import { Record } from "../../record";
import { TypeBuilder } from "../../type";
import { JSONValue } from "../../utils";
import { TypeBuilderImpl, isDescriptor } from "./core";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl<resolved.Pointer> {}

export function hasOne(
  entity: Record | builder.Descriptor,
  options: JSONValue = null
): TypeBuilder {
  let inner = isDescriptor(entity)
    ? entity
    : builder.Alias(entity.descriptor, entity.name);
  return new TypeBuilderImpl(
    builder.Pointer({
      name: "hasOne",
      metadata: null,
      args: options,
      inner,
      impl: PointerImpl
    })
  );
}
