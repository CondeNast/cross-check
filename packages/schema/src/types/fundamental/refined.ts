import { builder } from "../../descriptors";
import { TypeBuilder } from "../../type";
import { exhausted } from "../../utils";
import { TypeBuilderImpl } from "./core";
import { mapContainer, mapDictionary } from "./generic";
import { PrimitiveClass } from "./primitive";

const { is, isContainer } = builder;

export function baseType(desc: builder.RefinedPrimitive): builder.Primitive;
export function baseType(desc: builder.Alias): builder.Descriptor;
export function baseType<D extends builder.Descriptor>(desc: D): D;
export function baseType(desc: builder.Descriptor): builder.Descriptor {
  if (is(desc, "Refined")) {
    return desc.base(desc);
  } else if (is(desc, "Primitive")) {
    return desc;
  } else if (is(desc, "Dictionary") || is(desc, "Record")) {
    return mapDictionary(desc, (member, meta) => {
      return {
        descriptor: baseType(member),
        meta: { ...meta, required: false }
      };
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

export function RefinedBuilder<A extends builder.Args>(
  Class: PrimitiveClass<A | undefined>,
  base: builder.Base<A | undefined>,
  args?: A
): builder.RefinedPrimitive;
export function RefinedBuilder<A extends builder.Args>(
  Class: PrimitiveClass<A>,
  base: builder.Base<A>,
  args: A
): builder.RefinedPrimitive;
export function RefinedBuilder<A extends builder.Args>(
  Class: PrimitiveClass<A>,
  base: builder.Base<A>,
  args: A
): builder.RefinedPrimitive<A> {
  return {
    type: "Refined",
    name: Class.typeName,
    typescript: Class.typescript,
    description: Class.description,
    args,
    base
  };
}

export function Refined<A extends builder.Args>(
  Class: RefinedClass<A | undefined>,
  args?: A
): TypeBuilder;
export function Refined<A extends builder.Args>(
  Class: RefinedClass<A>,
  args: A
): TypeBuilder;
export function Refined<A extends builder.Args>(
  Class: RefinedClass<A | undefined>,
  args: A | undefined
): TypeBuilder {
  let refined = RefinedBuilder(
    Class,
    desc => Class.base(desc.args).descriptor,
    args
  );
  return new TypeBuilderImpl(refined);
}

export interface RefinedClass<A extends builder.Args>
  extends PrimitiveClass<A> {
  base: (options?: A) => TypeBuilder<builder.Primitive>;
}
