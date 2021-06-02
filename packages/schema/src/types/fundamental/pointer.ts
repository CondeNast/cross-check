import { builders, dehydrated } from "../../descriptors";
import { RegistryRecord } from "../../registry";
import { JSONObject } from "../../utils";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl {
  static for(inner: RegistryRecord, kind: string): PointerImpl {
    return new PointerImpl(inner.dictionary, inner.name, kind, inner.metadata);
  }

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
  options: JSONObject | null = null
): builders.PointerBuilder {
  return new builders.PointerBuilder({
    kind: "hasOne",
    metadata: options,
    record: item
  });
}
