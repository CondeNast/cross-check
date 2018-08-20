import { JSONObject, Option } from "ts-std";
import { builders, dehydrated } from "../../descriptors";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl {
  dehydrate(): dehydrated.Pointer {
    return {
      type: "Pointer",
      kind: this.kind,
      metadata: this.metadata,
      inner: this.name,
      required: "always"
    };
  }
}

export function hasOne(
  item: string,
  options: Option<JSONObject> = null
): builders.PointerBuilder {
  return new builders.PointerBuilder({
    kind: "hasOne",
    metadata: options,
    record: item
  });
}
