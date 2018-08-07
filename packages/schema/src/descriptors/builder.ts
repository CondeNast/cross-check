import { Dict, JSONObject, Option, dict, unknown } from "ts-std";
import { VisitorDescriptor } from "../types/describe/visitor";
import { JSONValue, mapDict } from "../utils";
import * as dehydrated from "./dehydrated";
import * as resolved from "./resolved";

export const METADATA = Symbol("METADATA");

export interface BuilderMetadata {
  features: Option<string[]>;
  required: Option<boolean>;
}

export const DEFAULT_BUILDER_METADATA = {
  features: null,
  required: false
}

export abstract class TypeBuilder<State = unknown> {
  constructor(readonly state: State, readonly meta: BuilderMetadata = DEFAULT_BUILDER_METADATA) { }

  required(isRequiredType?: boolean): TypeBuilder<State> {
    let Class = constructor(this);
    return new Class(this.state, { ...this.meta, required: isRequiredType || null });
  }

  features(features: string[]): TypeBuilder<State> {
    let Class = constructor(this);
    return new Class(this.state, { ...this.meta, features });
  }

  abstract dehydrate(): dehydrated.Descriptor;
  abstract visitor(): VisitorDescriptor;
}

export interface TypeBuilderConstructor<State> {
  new(state: State, meta: BuilderMetadata): TypeBuilder<State>;
}

function constructor<State>(builder: TypeBuilder<State>): TypeBuilderConstructor<State> {
  return builder.constructor as any as TypeBuilderConstructor<State>;
}

/***** Concrete Builders *****/

//// Dictionary ////

export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
  required: boolean;
}

export interface DictionaryMember {
  builder: TypeBuilder;
  meta: MembersMeta;
}

export interface DictionaryState {
  members: Dict<DictionaryMember>;
  metadata: JSONObject | null;
}

export class DictionaryBuilder extends TypeBuilder<DictionaryState> {
  dehydrate(): dehydrated.Dictionary {
    let members = mapDict(this.state.members, member => {
      return { descriptor: member.builder.dehydrate(), meta: member.meta };
    });

    return {
      type: "Dictionary",
      members,
      metadata: this.state.metadata
    }
  }
}

//// Iterator ////

export interface IteratorState {
  name: string;
  metadata: JSONObject | null;
  inner: NamedBuilder;
}

export class IteratorBuilder extends TypeBuilder<IteratorState> {
  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      name: this.state.name,
      metadata: this.state.metadata,
      inner: this.state.inner.dehydrate()
    }
  }
}

//// List ////

export interface ListArgs extends Dict<JSONValue> {
  readonly allowEmpty: boolean;
}

export interface ListState {
  args: ListArgs;
  inner: TypeBuilder;
}

export class ListBuilder extends TypeBuilder<ListState> {
  dehydrate(): dehydrated.List {
    return {
      type: "List",
      args: this.state.args,
      inner: this.state.inner.dehydrate()
    }
  }
}

//// Named ////

export interface NamedState {
  target: resolved.DescriptorType;
  name: string;
  args: {} | null | undefined;
}

export class NamedBuilder extends TypeBuilder<NamedState> {
  dehydrate(): dehydrated.Named {
    return {
      type: "Named",
      target: this.state.target,
      name: this.state.name,
      args: this.state.args
    }
  }
}

export interface PointerState {
  kind: string;
  metadata: JSONObject | null;
  inner: NamedBuilder;
}

export class PointerBuilder extends TypeBuilder<PointerState> {
  dehydrate(): dehydrated.Pointer {
    return {
      type: "Pointer",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.inner.dehydrate()
    }
  }
}

/***** Registry *****/

interface Registered<T> {
  type: T;
  metadata: JSONObject | null;
}

class Types {
  readonly records: Dict<Registered<Dict<TypeBuilder>>> = dict();
}

export class Registry {
  private types = new Types();

  record(name: string, fields: Dict<TypeBuilder>, metadata: JSONObject | null) {
    this.types.records[name] = { type: fields, metadata };
  }

  getMetadata(name: string): JSONObject | null {
    return this.types.records[name]!.metadata;
  }
}

export const REGISTRY = new Registry();
