import { JSONObject, Option } from "ts-std";
import { builders, dehydrated } from "../../descriptors";
import {} from "../../descriptors/dehydrated";
import { RegistryRecord } from "../../registry";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
  static for(inner: RegistryRecord, kind: string): IteratorImpl {
    return new IteratorImpl(inner.dictionary, inner.name, kind, inner.metadata);
  }

  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.kind,
      metadata: this.metadata,
      inner: this.name,
      required: "always"
    };
  }
}

export function hasMany(
  item: string,
  options: Option<JSONObject> = null
): builders.IteratorBuilder {
  return new builders.IteratorBuilder({
    kind: "hasMany",
    metadata: options,
    record: item
  });
}
