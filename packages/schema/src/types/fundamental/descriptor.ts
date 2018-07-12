import { Dict, JSONObject, Option } from "ts-std";
import { JSONValue } from "../utils";
import { Type } from "./value";

export interface AbstractTypeDescriptor<Args> {
  readonly type:
    | "Alias"
    | "Pointer"
    | "Iterator"
    | "List"
    | "Dictionary"
    | "Record"
    | "Primitive";
  readonly metadata: Option<JSONValue>;
  readonly args: Args;

  readonly name: Option<string>;
  readonly description: string;

  readonly required: boolean;
  readonly features: string[];
}

export type Named<T extends TypeDescriptor> = T & {
  name: string;
};

export type NamedDescriptor = Named<TypeDescriptor>;

export interface AliasDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "Alias";
  readonly metadata: null;
  readonly name: string;
  readonly args: Type;
  readonly required: false;
  readonly features: never[];
}

export interface ListDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "List";
  readonly metadata: Option<JSONValue>;
  readonly args: Type;
}

export interface PointerDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "Pointer";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly args: Type;
}

export interface IteratorDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly args: Type;
}

export interface DictionaryDescriptor
  extends AbstractTypeDescriptor<Dict<Type>> {
  readonly type: "Dictionary";
  readonly metadata: null;
  readonly args: Dict<Type>;
}

export interface RecordDescriptor extends AbstractTypeDescriptor<Dict<Type>> {
  readonly type: "Record";
  readonly name: string;
  readonly metadata: Option<JSONObject>;
  readonly args: Dict<Type>;
}

export interface PrimitiveDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractTypeDescriptor<Args | undefined> {
  readonly type: "Primitive";
  readonly typescript: string;
  readonly metadata: null;
  readonly args: Args | undefined;
}

export type TypeDescriptor =
  | AliasDescriptor
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor
  | DictionaryDescriptor
  | RecordDescriptor
  | PrimitiveDescriptor;

// args is a Type
export type CollectionDescriptor =
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;
