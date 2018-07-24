import { Option } from "ts-std";
import {
  AliasDescriptor,
  RequiredDescriptor,
  TypeDescriptor,
  isDescriptor
} from "../../descriptors";

/**
 *
 * @param {TypeDescriptor} desc
 * @returns {Option<boolean>} null if no required wrapper was found recursively,
 *   otherwise the value of the found required wrapper
 */
export function isRequired(desc: TypeDescriptor): Option<boolean> {
  if (isDescriptor(desc, "Required")) {
    return desc.args.required;
  }

  if (isDescriptor(desc, "Alias")) {
    return isRequired(desc.inner);
  }

  return null;
}

export function updateLeafPrimitive(
  desc: TypeDescriptor,
  transform: (desc: TypeDescriptor) => TypeDescriptor
): TypeDescriptor {
  if (isDescriptor(desc, "Required")) {
    return {
      ...desc,
      inner: updateLeafPrimitive(desc.inner, transform)
    } as RequiredDescriptor;
  } else if (isDescriptor(desc, "Alias")) {
    return {
      ...desc,
      inner: updateLeafPrimitive(desc.inner, transform)
    } as AliasDescriptor;
  } else if (isDescriptor(desc, "Primitive")) {
    return transform(desc);
  } else {
    return desc;
  }
}
