import { Dict, JSONObject, Option } from "ts-std";
import { Type } from "../types/fundamental";
import { JSONValue } from "../utils";

export interface Factory<Descriptor extends TypeDescriptor, T extends Type> {
  instantiate(desc: Descriptor): T;
  base(desc: Descriptor): TypeDescriptor;
}

export interface FactoryClass<
  Descriptor extends TypeDescriptor,
  T extends Type
> {
  new (desc: Descriptor): T;
  base(desc: Descriptor): TypeDescriptor;
}

export function factory<Descriptor extends TypeDescriptor, T extends Type>(
  TypeClass: FactoryClass<Descriptor, T>
): Factory<Descriptor, T> {
  return {
    instantiate(desc: Descriptor): T {
      return new TypeClass(desc);
    },

    base(desc: Descriptor): TypeDescriptor {
      return TypeClass.base(desc);
    }
  };
}

export interface UnknownTypeDescriptor {
  readonly type: keyof TypeDescriptors;
  readonly factory: Factory<this, Type>;
  readonly metadata: Option<JSONValue>;
  readonly args: JSONValue | undefined;

  // A human-readable description of the type. For non-primitive
  // types, this gives custom implementations an opportunity to
  // describe their purpose.
  readonly description: string;
}

export interface TypeDescriptor<
  Args extends JSONValue | undefined = JSONValue | undefined
> {
  readonly type: keyof TypeDescriptors;
  readonly factory: Factory<this, Type<this>>;
  readonly metadata: Option<JSONValue>;
  readonly args: Args;

  // A human-readable description of the type. For non-primitive
  // types, this gives custom implementations an opportunity to
  // describe their purpose.
  readonly description: string;
}

export function isDescriptor<K extends keyof TypeDescriptors>(
  desc: TypeDescriptor,
  type: K
): desc is TypeDescriptors[K] {
  return desc.type === type;
}

export function isGenericDescriptor(
  desc: TypeDescriptor
): desc is ListDescriptor | PointerDescriptor | IteratorDescriptor {
  switch (desc.type) {
    case "Iterator":
    case "Pointer":
    case "List":
      return true;
    default:
      return false;
  }
}

/**
 * - Design time:
 *   - reusable anonymous type: function() { return Type().required().features(...) }
 *   - reusable "named" type
 *   - registering types in some kind of registry
 *   - records
 * - Schema Serialization
 *   - serializing underlying validators
 *   - type and validator registry
 * - Introspection
 *   -
 * - Mapping
 *   - Type Name -> Code
 * - Transformation
 *   - draft
 *   - features
 * - Runtime
 *   - type.base (for primitives)
 *   - type.serialize(model)
 *   - type.parse(wire)
 *   - build(type.validation())
 *
 *
 * transform(hydrate(lookup(name)))
 * hydrate(transform(lookup(name)))
 */

/**
 * Steps:
 *
 * - Design time -> Descriptors
 * - Transformation -> Descriptors
 * - Hydration -> Types
 */

// TODO: This is not a runtime concept, but rather a transform-time feature
export interface AliasDescriptor extends UnknownTypeDescriptor {
  readonly type: "Alias";
  readonly name: string;
  readonly inner: TypeDescriptor;
  readonly metadata: null;
  readonly args: undefined;
}

export interface RequiredArgs extends JSONObject {
  readonly required: boolean;
}

export interface RequiredDescriptor<Args extends RequiredArgs = RequiredArgs>
  extends TypeDescriptor<Args> {
  readonly type: "Required";
  readonly inner: UnknownTypeDescriptor;
  readonly args: Args;
}

export interface ListArgs extends JSONObject {
  readonly allowEmpty: boolean;
}

export interface ListDescriptor<Args extends ListArgs = ListArgs>
  extends TypeDescriptor<Args> {
  readonly type: "List";
  readonly metadata: null;
  readonly inner: UnknownTypeDescriptor;
  readonly args: Args;
}

export interface PointerDescriptor<Args extends JSONValue = JSONValue>
  extends TypeDescriptor<Args> {
  readonly type: "Pointer";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly inner: UnknownTypeDescriptor;
  readonly args: Args;
}

export interface IteratorDescriptor<Args extends JSONValue = JSONValue>
  extends TypeDescriptor<Args> {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly inner: UnknownTypeDescriptor;
  readonly args: Args;
}

export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
}

export interface DictionaryDescriptor<Args extends JSONValue = JSONValue>
  extends TypeDescriptor<Args> {
  readonly type: "Dictionary";
  readonly members: Dict<UnknownTypeDescriptor>;
  readonly membersMeta: Dict<MembersMeta>;
  readonly metadata: null;
}

export interface RecordDescriptor<Args extends JSONValue = JSONValue>
  extends TypeDescriptor<Args> {
  readonly type: "Record";
  readonly members: Dict<UnknownTypeDescriptor>;
  readonly membersMeta: Dict<JSONValue>;
  readonly metadata: Option<JSONObject>;
  readonly name: string;
}

export type AnyDictionaryDescriptor<Args extends JSONValue = JSONValue> =
  | DictionaryDescriptor<Args>
  | RecordDescriptor<Args>;

export interface PrimitiveDescriptor<
  Args extends JSONValue | undefined = JSONValue | undefined
> extends TypeDescriptor<Args> {
  readonly type: "Primitive";
  readonly name: string;
  readonly typescript: string;
  readonly metadata: null;
  readonly args: Args;
}

export type ContainerDescriptor =
  | AliasDescriptor
  | RequiredDescriptor
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;

export interface TypeDescriptors {
  Alias: AliasDescriptor;
  Required: RequiredDescriptor;
  List: ListDescriptor;
  Pointer: PointerDescriptor;
  Iterator: IteratorDescriptor;
  Dictionary: DictionaryDescriptor;
  Record: RecordDescriptor;
  Primitive: PrimitiveDescriptor;
}

// Is a concrete type (not a wrapper type like Required or Alias)
// and has an `inner` type
export type CollectionDescriptor =
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;
