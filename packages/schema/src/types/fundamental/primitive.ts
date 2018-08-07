import { builder, resolved } from "../../descriptors";
import { Type, TypeBuilder } from "../../type";
import { TypeBuilderImpl } from "./core";

export function Primitive<A extends builder.Args>(
  Class: PrimitiveClass<A | undefined>,
  options?: A
): TypeBuilder<builder.Primitive>;
export function Primitive<A extends builder.Args>(
  Class: PrimitiveClass<A>,
  options: A
): TypeBuilder<builder.Primitive>;
export function Primitive<A extends builder.Args>(
  Class: PrimitiveClass<A>,
  options: A
): TypeBuilder<builder.Primitive> {
  return new TypeBuilderImpl(PrimitiveBuilder(Class, options));
}

export interface PrimitiveClass<A extends builder.Args> {
  typescript: string;
  description: string;
  typeName: string;
  new(desc: resolved.Primitive<A>): Type;
  buildArgs?(desc: A, required: boolean): A;
}

export function PrimitiveBuilder<A extends builder.Args>(
  Class: PrimitiveClass<A | undefined>,
  args?: A
): builder.Primitive;
export function PrimitiveBuilder<A extends builder.Args>(
  Class: PrimitiveClass<A>,
  args: A
): builder.Primitive;

export function PrimitiveBuilder<A extends builder.Args>(
  Class: PrimitiveClass<A>,
  args: A
): builder.Primitive<A> {
  return {
    type: "Primitive",
    name: Class.typeName,
    typescript: Class.typescript,
    description: Class.description,
    args
  }
}
