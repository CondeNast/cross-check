import { Option } from "ts-std";
import { exhausted } from "../utils";
import { RequiredDescriptor, TypeDescriptor, defaults } from "./descriptor";
import { RequiredType, TypeBuilder } from "./value";

export function Required(
  type: TypeBuilder,
  isTypeRequired = true
): RequiredType {
  if (type instanceof RequiredType) {
    return Required(type.descriptor.inner, isTypeRequired);
  }

  return new RequiredType(
    defaults("Required", {
      factory: (descriptor: RequiredDescriptor) => new RequiredType(descriptor),
      inner: type,
      args: { required: isTypeRequired },
      description: "required"
    })
  );
}

/**
 *
 * @param {TypeDescriptor} desc
 * @returns {Option<boolean>} null if no required wrapper was found recursively,
 *   otherwise the value of the found required wrapper
 */
export function isRequired(desc: TypeDescriptor): Option<boolean> {
  switch (desc.type) {
    case "Required":
      return desc.args.required;
    case "Alias":
    case "Primitive":
    case "List":
    case "Dictionary":
    case "Iterator":
    case "Pointer":
    case "Record":
      return null;
    default:
      return exhausted(desc);
  }
}
