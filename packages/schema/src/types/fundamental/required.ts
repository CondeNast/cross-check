import { Option } from "ts-std";
import { exhausted } from "../utils";
import { TypeDescriptor } from "./descriptor";

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
      return isRequired(desc.inner);
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
