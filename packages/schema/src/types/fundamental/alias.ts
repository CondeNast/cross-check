import { AliasType, Type } from "./value";

export function Alias(name: string, type: Type): AliasType {
  return new AliasType({
    type: "Alias",
    metadata: null,
    args: type,
    name,
    description: `${name} (alias for ${type.descriptor.description})`,
    features: []
  });
}
