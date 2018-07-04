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
