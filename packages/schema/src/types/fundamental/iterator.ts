import { JSONObject, Option } from "ts-std";
import { builders, dehydrated } from "../../descriptors";
import { RecordBuilder } from "../../record";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.kind,
      metadata: this.metadata,
      inner: {
        type: "Record",
        name: this.name,
        required: "always"
      },
      required: "always"
    };
  }
}

export function hasMany(
  item: RecordBuilder,
  options: Option<JSONObject> = null
): builders.IteratorBuilder {
  return new builders.IteratorBuilder({
    kind: "hasMany",
    metadata: options,
    record: item
  });
}
