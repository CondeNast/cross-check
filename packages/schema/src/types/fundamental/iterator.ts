import { JSONObject, Option } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { Record } from "../../record";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
  readonly descriptor!: resolved.Iterator;
}

export function hasMany(
  item: Record,
  options: Option<JSONObject> = null
): registered.Iterator {
  return new registered.Iterator({
    kind: "hasMany",
    metadata: options,
    contents: item.type
  });
}
