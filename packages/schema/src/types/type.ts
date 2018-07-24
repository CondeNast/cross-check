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

export interface AnyPrimitiveClass<
  Args extends JSONValue | undefined = JSONValue | undefined
> {
  typescript: string;
  description: string;
  typeName: string;
  base?: (descriptor: PrimitiveDescriptor<Args>) => TypeDescriptor;
  basePrimitive?: (args: Args) => TypeBuilder<PrimitiveDescriptor<Args>>;

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

export type TypeConstructor = () => TypeBuilder;

export type PrimitiveConstructor<Args extends JSONValue | undefined> = [
  Args
] extends [undefined] // If the args are exactly undefined, the constructor is a zero-arg function
  ? () => TypeBuilder<PrimitiveDescriptor<Args>> // Otherwise, if the args extend JSONValue (and therefore do not include // undefined), the constructor is a one-arg function that takes the args.
  : [Args] extends [JSONValue]
    ? (args: Args) => TypeBuilder<PrimitiveDescriptor<Args>> // Otherwise, the arguments must be JSONValue | undefined, so the // constructor is an optional one-arg function.
    : (args?: Args) => TypeBuilder<PrimitiveDescriptor<Args>>;

export function primitive<Args extends JSONValue>(
  PrimitiveClass: AnyPrimitiveClass<Args>,
  defaultArgs: Args
): PrimitiveConstructor<Args | undefined>;
export function primitive<Args extends JSONValue | undefined>(
  PrimitiveClass: AnyPrimitiveClass<Args>,
  defaultArgs?: Args
): PrimitiveConstructor<Args>;
export function primitive<Args extends JSONValue | undefined>(
  PrimitiveClass: AnyPrimitiveClass<Args>,
  defaultArgs?: Args
): PrimitiveConstructor<Args> {
  return ((args: Args) => {
    return Primitive<Args>(PrimitiveClass, args || defaultArgs);
  }) as PrimitiveConstructor<Args>;
}

export function Primitive<Args extends JSONValue | undefined>(
  PrimitiveClass: AnyPrimitiveClass<Args>,
  args: Args
): TypeBuilder {
  let descriptor: PrimitiveDescriptor<Args> = {
    type: "Primitive",
    factory: {
      instantiate(
        desc: PrimitiveDescriptor<Args>
      ): Type<PrimitiveDescriptor<Args>> {
        return new PrimitiveClass(desc);
      },

      base(desc: PrimitiveDescriptor<Args>): TypeDescriptor {
        if (PrimitiveClass.base) {
          return PrimitiveClass.base(desc);
        } else if (PrimitiveClass.basePrimitive) {
          return PrimitiveClass.basePrimitive(desc.args).descriptor;
        } else {
          return desc;
        }
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
