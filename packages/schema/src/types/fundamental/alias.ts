import { AliasType, TypeBuilder } from "./value";

export function Alias(type: TypeBuilder, name: string): AliasType {
  return new AliasType({
    type: "Alias",
    metadata: null,
    isBase: false,
    inner: type,
    args: null,
    name,
    description: `${name} (alias for ${type.descriptor.description})`
  });
}
