import { TypeDescriptor, defaults } from "./descriptor";
import { RequiredType, Type } from "./value";

export function Required(type: Type, isTypeRequired = true): RequiredType {
  if (type instanceof RequiredType) {
    return Required(type.descriptor.args.type, isTypeRequired);
  }

  return new RequiredType(
    defaults("Required", {
      args: { type, required: isTypeRequired },
      description: "required"
    })
  );
}

export function isRequired(desc: TypeDescriptor) {
  // TODO: Recursive walk
  return desc.type === "Required" && desc.args.required;
}
