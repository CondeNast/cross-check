import { builder, resolved } from "../../descriptors";
import { Record } from "../../record";
import { TypeBuilder } from "../../type";
import { JSONValue } from "../../utils";
import { TypeBuilderImpl } from "./core";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl<resolved.Pointer> {}

export function hasOne(entity: Record, options: JSONValue = null): TypeBuilder {
  return new TypeBuilderImpl(
    builder.Pointer({
      name: "hasOne",
      metadata: null,
      args: options,
      inner: builder.Alias(entity.descriptor, entity.name),
      impl: PointerImpl
    })
  );
}
