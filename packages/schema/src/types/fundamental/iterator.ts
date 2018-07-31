import { JSONObject, Option } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { Record } from "../../record";
import { TypeBuilder } from "./core";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl<resolved.Iterator> {}

export function hasMany(
  item: Record,
  options: Option<JSONObject> = null
): TypeBuilder {
  return new TypeBuilder(
    builder.Iterator({
      name: "hasMany",
      metadata: options,
      inner: item.descriptor,
      args: null,
      impl: IteratorImpl
    })
  );
}
