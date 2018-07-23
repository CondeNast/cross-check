import { PrimitiveDescriptor, TypeDescriptor } from "../descriptors";
import { Type, TypeBuilder } from "./fundamental";

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
 *   in-progress work in a user interface.
 */

export interface PrimitiveClass {
  base?: TypeBuilder;
  typescript: string;
  description: string;
  typeName: string;
  new (desc: PrimitiveDescriptor): Type<PrimitiveDescriptor>;
}

export interface TypeClass {
  new (descriptor: PrimitiveDescriptor): TypeBuilder;
}

export type TypeDescription = TypeClass | TypeBuilder;

export interface GenericClass {
  new (descriptor: PrimitiveDescriptor): TypeBuilder;
}

export type GenericDescription = GenericClass | TypeBuilder;

export function generic(
  callback: (...T: TypeBuilder[]) => TypeBuilder
): Generic {
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

export type Generic = (...T: TypeDescription[]) => TypeBuilder;

export type PrimitiveConstructor = () => TypeBuilder;
export type TypeConstructor = () => TypeBuilder;

export function primitive(Primitive: PrimitiveClass): TypeConstructor {
  let type = constructType(Primitive);
  return () => type;
}

function constructType(Primitive: PrimitiveClass): TypeBuilder {
  let base = Primitive.base ? Primitive.base.descriptor : null;

  let descriptor: PrimitiveDescriptor = {
    type: "Primitive",
    factory: {
      instantiate(desc: PrimitiveDescriptor): Type<PrimitiveDescriptor> {
        return new Primitive(desc);
      },

      base(desc: PrimitiveDescriptor): TypeDescriptor {
        return base || desc;
      }
    },
    typescript: Primitive.typescript,
    description: Primitive.description,
    name: Primitive.typeName,
    metadata: null,
    args: undefined
  };

  return new TypeBuilder(descriptor);
}
