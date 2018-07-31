import { unresolved } from "../../descriptors";
import { exhausted } from "../../utils";
import { mapContainer, mapDict } from "./generic";

const { is, isContainer } = unresolved;

export function baseType(desc: unresolved.Refined): unresolved.Primitive;
export function baseType(desc: unresolved.Alias): unresolved.Descriptor;
export function baseType<D extends unresolved.Descriptor>(desc: D): D;
export function baseType(desc: unresolved.Descriptor): unresolved.Descriptor {
  if (is(desc, "Refined")) {
    return desc.base(desc);
  } else if (is(desc, "Primitive")) {
    return desc;
  } else if (is(desc, "Dictionary") || is(desc, "Record")) {
    return mapDict(desc, (member, meta) => {
      return [baseType(member), { ...meta, required: false }];
    });
  } else if (is(desc, "Alias")) {
    return baseType(desc.inner);
  } else if (is(desc, "List")) {
    return Object.assign({}, desc, {
      inner: baseType(desc.inner)
    });
  } else if (isContainer(desc)) {
    return mapContainer(desc, baseType);
  } else if (is(desc, "Generic")) {
    throw new Error("Not implemented");
  }

  return exhausted(desc);
}
