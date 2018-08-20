import { JSONObject, Option } from "ts-std";
import { builders, dehydrated } from "../../descriptors";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
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
