import { JSONObject, Option } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { RecordBuilder } from "../../record";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
  readonly descriptor!: resolved.Iterator;
}

export function hasMany(
  item: RecordBuilder,
  options: Option<JSONObject> = null
): registered.IteratorBuilder {
  return new registered.IteratorBuilder({
    kind: "hasMany",
    metadata: options,
    record: item
  });
}
