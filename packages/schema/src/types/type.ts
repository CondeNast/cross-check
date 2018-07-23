import { PrimitiveDescriptor, TypeDescriptor } from "../descriptors";
import { JSONValue } from "../utils";
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

export interface AnyPrimitiveClass<Args extends JSONValue | undefined> {
  base?: TypeBuilder;
  typescript: string;
  description: string;
  typeName: string;
  new (desc: PrimitiveDescriptor<Args>): Type<PrimitiveDescriptor<Args>>;
}

export interface TypeClass {
  new (descriptor: PrimitiveDescriptor): TypeBuilder;
}

export type TypeDescription = TypeClass | TypeBuilder;

// export interface GenericClass {
//   new (descriptor: PrimitiveDescriptor): TypeBuilder;
// }

// export type GenericDescription = GenericClass | TypeBuilder;

// export function generic(
//   callback: (...T: TypeBuilder[]) => TypeBuilder
// ): Generic {
//   return (...descs: GenericDescription[]) => {
//     // @ts-ignore
//     let types = descs.map(constructType);
//     let type = callback(...types);

//     let name = descs
//       // @ts-ignore
//       .map(d => typeNameOf(constructType(d).description.name))
//       .join("");

//     return type.named(name);
//   };
// }

// export type Generic = (...T: TypeDescription[]) => TypeBuilder;

export type PrimitiveConstructor = () => TypeBuilder;
export type TypeConstructor = () => TypeBuilder;

export type Primitive<Args extends JSONValue | undefined> = Args extends
  | JSONValue
  | undefined
  ? () => TypeBuilder
  : (args: Args) => TypeBuilder;

// TODO: This branch doesn't catch calls with arity-less functions
export function primitive<Args extends JSONValue>(
  PrimitiveClass: AnyPrimitiveClass<Args>
): (args: Args) => TypeBuilder;
export function primitive<J extends JSONValue, T extends J | undefined>(
  PrimitiveClass: AnyPrimitiveClass<T>
): (args?: T) => TypeBuilder;
export function primitive(
  PrimitiveClass: AnyPrimitiveClass<JSONValue | undefined>
): Primitive<JSONValue> | Primitive<JSONValue | undefined> {
  return ((args?: JSONValue | undefined) => {
    return Primitive(PrimitiveClass, args);
  }) as any; // TODO
}

export function Primitive<Args extends JSONValue | undefined>(
  PrimitiveClass: AnyPrimitiveClass<Args>,
  args: Args extends void ? undefined : Args
): TypeBuilder<PrimitiveDescriptor<Args>> {
  let base = PrimitiveClass.base ? PrimitiveClass.base.descriptor : null;

  let descriptor: PrimitiveDescriptor<Args> = {
    type: "Primitive",
    factory: {
      instantiate(
        desc: PrimitiveDescriptor<Args>
      ): Type<PrimitiveDescriptor<Args>> {
        return new PrimitiveClass(desc);
      },

      base(desc: PrimitiveDescriptor<Args>): TypeDescriptor {
        return base || desc;
      }
    },
    typescript: PrimitiveClass.typescript,
    description: PrimitiveClass.description,
    name: PrimitiveClass.typeName,
    metadata: null,
    args
  };

  return new TypeBuilder(descriptor);
}
