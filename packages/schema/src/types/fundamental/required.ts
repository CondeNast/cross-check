import { Option } from "ts-std";
import { TypeDescriptor, isDescriptor } from "../../descriptors";

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
