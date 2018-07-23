# July 3: VisitorDelegate schema -> record

If you implemented a VisitorDelegate, change the `schema` method to `record`:

```ts
class JSONFormatter implements RecursiveDelegate {
  schema(
    label: RecordLabel
  ): {
    fields: Dict<Item>;
    metadata: Option<Dict>;
  } {
    return {
      fields: this.dictionaryOrRecord(label),
      metadata: label.metadata
    };
  }
}
```

to

```ts
class JSONFormatter implements RecursiveDelegate {
  record(
    label: RecordLabel
  ): {
    fields: Dict<Item>;
    metadata: Option<Dict>;
  } {
    return {
      fields: this.dictionaryOrRecord(label),
      metadata: label.metadata
    };
  }
}
```

# July 12: Records now take metadata inline

```ts
Record("Article", {
  // fields
}).metadata({
  // metadata
})
```

to

```ts
Record("Article", {
  fields: {
    // fields
  },

  metadata: {
    // metadata
  }
})
```

Metadata is optional.

# July 12: Delegates now take Descriptors instead of Labels

```ts
class JSONFormatter implements RecursiveDelegate {
  record(
    descriptor: RecordDescriptor
  ): {
    fields: Dict<Item>;
    metadata: Option<Dict>;
  } {
    return {
      fields: this.dictionaryOrRecord(descriptor.args),
      metadata: descriptor.metadata
    };
  }
}
```

# July 18: Normalized Container Types

All container types now store their inner types in normalized locations:

- Single-item containers (`List`, `Pointer`, `Iterator`, `Required`, `Alias`)
  store their inner type at `inner`.
- Dictionary-style containers (`Dictionary`, `Record`) store a dictionary of
  their inner types at `members`.

Any additional arguments are still at `descriptor.args`.

# July 23: Type Narrowing

```ts
if (desc.type === "Required") {
  // desc is RequiredDescriptor inside
}
```

to

```ts
import { isDescriptor } from "@cross-check/schema";

if (isDescriptor(desc, "Required")) {
  // desc is RequiredDescriptor inside
}
```
