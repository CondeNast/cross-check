# CrossCheck Schemas

CrossCheck schemas describe the structure of domain objects, as well as an associated type for each field.

A type describes the following characteristics:

- validation: what values are valid for this type
- serialization: how to turn a valid value in this type into the wire format
- parsing: how to turn the  wire format for this type into a valid value

Validation rules are written as [CrossCheck validations][cross-check-validations].

Let's define the `string` type, one of the simplest types you can define in CrossCheck schemas:

```ts
const string = {
  type: "Primitive",
  name: "string",
  args
}
```
