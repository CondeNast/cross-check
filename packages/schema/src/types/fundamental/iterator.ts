import { JSONObject, Option } from "ts-std";
import { builders, dehydrated, resolved } from "../../descriptors";
import { RecordBuilder } from "../../record";
import { ReferenceImpl } from "./reference";

export class IteratorImpl extends ReferenceImpl {
  readonly descriptor!: resolved.Iterator;

  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.kind,
      metadata: this.metadata,
      inner: {
        type: "Record",
        name: this.name,
        required: true
      },
      required: true
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
