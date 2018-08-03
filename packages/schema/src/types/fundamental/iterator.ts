import { JSONObject, Option } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { Record } from "../../record";
import { TypeBuilder } from "../../type";
import { JSONValue } from "../../utils";
import { TypeBuilderImpl, isDescriptor } from "./core";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl<resolved.Iterator> {}

export function hasMany(
  item: Record | builder.Descriptor,
  options: Option<JSONObject> = null
): TypeBuilder {
  let inner = isDescriptor(item)
    ? item
    : builder.Alias(item.descriptor, item.name);

  return new TypeBuilderImpl(
    builder.Iterator({
      name: "hasMany",
      metadata: options,
      inner,
      args: null,
      impl: IteratorImpl
    })
  );
}
