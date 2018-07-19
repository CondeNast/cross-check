import { Dict, JSONObject, Option } from "ts-std";
import { JSONValue } from "../utils";
import { Type } from "./value";

export interface AbstractTypeDescriptor<Args extends JSONValue | undefined> {
  readonly type: TypeDescriptor["type"];
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

export interface AbstractContainerDescriptor<
  Args extends JSONValue = JSONValue
> extends AbstractTypeDescriptor<Args> {
  readonly inner: Type;
}

export interface AliasDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Alias";
  readonly name: string;
  readonly isBase: boolean;
  readonly metadata: null;
  readonly inner: Type;
  readonly args: Args;
}

export interface FeaturesArgs extends JSONObject {
  readonly features: string[];
}

export interface FeaturesDescriptor<Args extends FeaturesArgs = FeaturesArgs>
  extends AbstractContainerDescriptor<FeaturesArgs> {
  readonly type: "Features";
  readonly args: Args;
}

export interface RequiredArgs extends JSONObject {
  readonly required: boolean;
}

export interface RequiredDescriptor<Args extends RequiredArgs = RequiredArgs>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Required";
  readonly inner: Type;
  readonly args: Args;
}

export interface ListArgs extends JSONObject {
  readonly allowEmpty: boolean;
}

export interface ListDescriptor<Args extends ListArgs = ListArgs>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "List";
  readonly metadata: null;
  readonly inner: Type;
  readonly args: Args;
}

export interface PointerDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Pointer";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly inner: Type;
  readonly args: Args;
}

export interface IteratorDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractContainerDescriptor<Args> {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly inner: Type;
  readonly args: Args;
}

export interface AbstractDictionaryDescriptor<
  Args extends JSONValue = JSONValue
> extends AbstractTypeDescriptor<Args> {
  readonly type: "Dictionary" | "Record";
  readonly members: Dict<Type>;
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
  | FeaturesDescriptor
  | AliasDescriptor
  | RequiredDescriptor
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;

export type TypeDescriptor =
  | ContainerDescriptor
  | DictionaryDescriptor
  | RecordDescriptor
  | PrimitiveDescriptor;

// Is a concrete type (not a wrapper type like Required or Alias)
// and has an `inner` type
export type CollectionDescriptor =
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;
