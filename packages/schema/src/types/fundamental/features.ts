import { FeaturesType, Type } from "./value";

export function Features(type: Type, features: string[]): FeaturesType {
  return new FeaturesType({
    type: "Features",
    metadata: features,
    inner: type,
    args: { features },
    description: `features (${JSON.stringify(features)})`
  });
}
