import { PrimitiveDescriptor, TypeDescriptor } from "./fundamental/descriptor";
import { Type } from "./fundamental/value";

/**
 * Internals Vocabulary:
 *
 * Reference Type:
 *   Represents data that is not directly included in the parent object.
 *   Dereferencing a reference may be asynchronous.
 *
 * Inline Type:
 *   Represent data that is directly included in the parent object.
 *   They include scalars, lists and dictionaries.
 *
 * Value:
 *   A value of any type (reference or inline).
 *
 * Scalar (Inline):
 *   A single inline value.
 *
 * List (Inline):
 *   A list of inline values.
 *
 * Dictionary (Inline):
 *   A set of key-value pairs. A dictionary's values are inline value. A dictionary's keys are strings.
 *
 * Pointer (Reference):
 *   A reference to another value.
 *
 * Iterator (Reference):
 *   A reference to a sequence of values. Each iteration of an iterator may be asynchronous.
 *
 * Refined Type:
 *   A type that has a strict component and a draft component. Component must either both be inline
 *   or both be references. A type's draft component corresponds to distinctions in underlying
 *   storage and user interface elements, and is intended to make it possible to auto-save
 *   in-progress work in a user interface.s
 */

export interface TypeClass {
  new (descriptor: PrimitiveDescriptor): Type<PrimitiveDescriptor>;
}

export type TypeDescription = TypeClass | Type<PrimitiveDescriptor>;

export interface GenericClass {
  new (descriptor: PrimitiveDescriptor): Type<TypeDescriptor>;
}

export type GenericDescription = GenericClass | Type<TypeDescriptor>;

export function generic(callback: (...T: Type[]) => Type): Generic {
  return (...descs: GenericDescription[]) => {
    // @ts-ignore
    let types = descs.map(constructType);
    let type = callback(...types);

    let name = descs
      // @ts-ignore
      .map(d => typeNameOf(constructType(d).description.name))
      .join("");

    return type.named(name);
  };
}

export type Generic = (...T: TypeDescription[]) => Type;

export type PrimitiveConstructor = () => Type<PrimitiveDescriptor>;
export type TypeConstructor = () => Type;

export function basic(
  name: string,
  desc: TypeDescription,
  typescript: string,
  description: string
): TypeConstructor {
  let type = constructType(name, desc, typescript, description);
  return () => type;
}

export function opaque(
  name: string,
  type: TypeDescription,
  typescript: string,
  description: string
): TypeConstructor {
  let t = constructType(name, type, typescript, description);
  return () => t;
}

function constructType(
  name: string,
  desc: TypeDescription,
  typescript: string,
  description: string
): Type<PrimitiveDescriptor> {
  let descriptor: PrimitiveDescriptor = {
    type: "Primitive" as "Primitive",
    typescript,
    description,
    name,
    features: [],
    metadata: null,
    args: undefined
  };

  return typeof desc === "function" ? new desc(descriptor) : desc;
}
