import { JSONObject, Option } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { RecordBuilder } from "../../record";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl {
  readonly descriptor!: resolved.Pointer;
}

export function hasOne(
  item: RecordBuilder,
  options: Option<JSONObject> = null
): registered.PointerBuilder {
  return new registered.PointerBuilder({
    kind: "hasOne",
    metadata: options,
    record: item
  });
}
