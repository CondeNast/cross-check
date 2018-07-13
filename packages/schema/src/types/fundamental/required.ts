import { defaults } from "./descriptor";
import { RequiredType, Type } from "./value";

export function Required(type: Type, isRequired = true): RequiredType {
  if (type instanceof RequiredType) {
    return Required(type.descriptor.args.type, isRequired);
  }

  return new RequiredType(
    defaults("Required", {
      args: { type, required: isRequired },
      description: "required"
    })
  );
}
