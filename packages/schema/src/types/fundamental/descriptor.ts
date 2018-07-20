import { Dict, JSONObject, Option } from "ts-std";
import { JSONValue } from "../utils";
import { Type } from "./value";

export interface AbstractTypeDescriptor<
  Args extends JSONValue | undefined = JSONValue | undefined
> {
  readonly type: TypeDescriptor["type"];
  readonly factory: (descriptor: this) => Type;
  readonly metadata: Option<JSONValue>;
  readonly args: Args;

  // A human-readable description of the type. For non-primitive
  // types, this gives custom implementations an opportunity to
  // describe their purpose.
  readonly description: string;
}

export function defaults<K extends TypeDescriptor["type"], Options>(
  type: K,
  options: Options
): {
  type: K;
  args: null;
  metadata: null;
} & Options {
  return Object.assign(
    {
      type,
      args: null,
      metadata: null
    },
    options
  );
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

export interface AbstractContainerDescriptor<
  Args extends JSONValue = JSONValue
> extends AbstractTypeDescriptor<Args> {
  readonly inner: TypeDescriptor;
}

// TODO: This is not a runtime concept, but rather a transform-time feature
export interface AliasDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Alias";
  readonly name: string;
  readonly metadata: null;
  readonly args: Args;
}

export interface RequiredArgs extends JSONObject {
  readonly required: boolean;
}

export interface RequiredDescriptor<Args extends RequiredArgs = RequiredArgs>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Required";
  readonly args: Args;
}

export interface ListArgs extends JSONObject {
  readonly allowEmpty: boolean;
}

export interface ListDescriptor<Args extends ListArgs = ListArgs>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "List";
  readonly metadata: null;
  readonly args: Args;
}

export interface PointerDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Pointer";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly args: Args;
}

export interface IteratorDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly args: Args;
}

export interface AbstractDictionaryDescriptor<
  Args extends JSONValue = JSONValue
> extends AbstractTypeDescriptor<Args> {
  readonly type: "Dictionary" | "Record";
  readonly members: Dict<TypeDescriptor>;
  readonly args: Args;
}
export interface DictionaryDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractDictionaryDescriptor<Args> {
  readonly type: "Dictionary";
  readonly metadata: null;
}

export interface RecordDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractDictionaryDescriptor<Args> {
  readonly type: "Record";
  readonly metadata: Option<JSONObject>;
  readonly isBase: boolean;
  readonly name: string;
}

export interface PrimitiveDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractTypeDescriptor<Args | undefined> {
  readonly type: "Primitive";
  readonly name: string;
  readonly typescript: string;
  readonly metadata: null;
  readonly args: Args | undefined;
}

export type ContainerDescriptor =
  | AliasDescriptor
  | RequiredDescriptor
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;

export type TypeDescriptor =
  | AliasDescriptor
  | RequiredDescriptor
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor
  | DictionaryDescriptor
  | RecordDescriptor
  | PrimitiveDescriptor;

// Is a concrete type (not a wrapper type like Required or Alias)
// and has an `inner` type
export type CollectionDescriptor =
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;
