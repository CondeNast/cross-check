import { JSONObject, Option } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { Record } from "../../record";
import { TypeBuilder } from "../../type";
import { JSONValue } from "../../utils";
import { AliasBuilder, TypeBuilderImpl, isDescriptor } from "./core";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl<resolved.Pointer> { }

export function hasOne(
  entity: Record | builder.Descriptor,
  options: JSONValue = null
): TypeBuilder {
  let inner = isDescriptor(entity)
    ? entity
    : AliasBuilder(entity.descriptor, entity.name);
  return new TypeBuilderImpl(
    PointerBuilderDescriptor({
      name: "hasOne",
      metadata: null,
      args: options,
      inner
    })
  );
}

export function PointerBuilderDescriptor<A extends JSONValue>({
  name,
  metadata,
  inner
}: {
    name: string;
    metadata: Option<JSONObject>;
    inner: builder.Descriptor;
    args: A;
  }): builder.Pointer {
  return {
    type: "Pointer",
    name,
    metadata,
    inner
  };
}

export function ResolvedPointer(
  inner: resolved.Descriptor
): resolved.Pointer {
  return {
    type: "Pointer",
    inner,
    instantiate: desc => new PointerImpl(desc)
  };
}
