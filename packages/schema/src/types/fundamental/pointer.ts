import { JSONObject, Option } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { Record } from "../../record";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl<resolved.Pointer> { }

export function hasOne(
  item: Record,
  options: Option<JSONObject> = null
): registered.Pointer {
  return new registered.Pointer({
    kind: "hasOne",
    metadata: options,
    contents: item.type
  });
}
