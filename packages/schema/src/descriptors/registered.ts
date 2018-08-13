import { Dict, JSONObject, Option, unknown } from "ts-std";
import { RecordBuilder } from "../record";
import { RegistryName } from "../registry";
import { DictionaryImpl } from "../types";
import { JSONValue, mapDict } from "../utils";
import * as dehydrated from "./dehydrated";
import * as resolved from "./resolved";

export interface TypeMetadata {
  features: Option<string[]>;
  required: Option<boolean>;
}

export function finalizeMeta(typeBuilder: TypeBuilder): MembersMeta {
  return {
    features: typeBuilder.meta.features || undefined,
    required: typeBuilder.meta.required || false
  };
}

export interface TypeState<State = unknown> {
  state: State;
  meta: TypeMetadata;
}

export const DEFAULT_TYPE_METADATA = {
  features: null,
  required: false
};

export type TypeMap<State> = (state: TypeState<State>) => TypeState<State>;

export function mapMeta<T extends TypeBuilder>(
  registeredType: T,
  callback: (meta: TypeMetadata) => TypeMetadata
): T {
  let mapped = callback(registeredType.meta);
  return registeredType.construct(registeredType.state, mapped);
}

export abstract class TypeBuilder<State = unknown> {
  constructor(
    readonly state: State,
    readonly meta: TypeMetadata = DEFAULT_TYPE_METADATA
  ) {}

  construct(state: State, meta: this["meta"]): this {
    let Class = this.constructor as TypeBuilderConstructor<this>;
    return new Class(state, meta) as this;
  }

  required(isRequiredType?: boolean): TypeBuilder<State> {
    return mapMeta(this, typeMetadata => ({
      ...typeMetadata,
      required: isRequiredType === undefined ? true : isRequiredType
    }));
  }

  features(features: string[]): TypeBuilder<State> {
    return mapMeta(this, typeMetadata => ({ ...typeMetadata, features }));
  }

  abstract dehydrate(): dehydrated.Descriptor;
}

export interface TypeBuilderConstructor<B extends TypeBuilder> {
  new (state: B["state"], meta: TypeMetadata): TypeBuilder;
}

/***** Concrete Builders *****/

//// Dictionary ////

export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
  required: boolean;
}

export interface DictionaryBuilderState {
  members: Dict<TypeBuilder>;
}

export class DictionaryBuilder extends TypeBuilder<DictionaryBuilderState> {
  dehydrate(): dehydrated.Dictionary {
    let members = mapDict(this.state.members, member => {
      return {
        descriptor: member.dehydrate(),
        meta: finalizeMeta(member)
      };
    });

    return {
      type: "Dictionary",
      members
    };
  }
}

//// Iterator ////

export interface IteratorBuilderState {
  kind: string;
  metadata: JSONObject | null;
  record: RecordBuilder;
}

export class IteratorBuilder extends TypeBuilder<IteratorBuilderState> {
  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.record.dehydrate()
    };
  }
}

//// List ////

export interface ListBuilderState {
  args?: resolved.ListArgs;
  contents: TypeBuilder;
}

export class ListBuilder extends TypeBuilder<ListBuilderState> {
  dehydrate(): dehydrated.List {
    return {
      type: "List",
      args: this.state.args,
      inner: this.state.contents.dehydrate()
    };
  }
}

//// Named ////

export interface NamedBuilderState {
  target: RegistryName;
  name: string;
  args?: {} | null;
}

export class NamedBuilder extends TypeBuilder<NamedBuilderState> {
  dehydrate(): dehydrated.Named {
    return {
      type: "Named",
      target: this.state.target,
      name: this.state.name,
      args: this.state.args
    };
  }
}

//// Pointer ////

export interface PointerBuilderState {
  kind: string;
  metadata: JSONObject | null;
  record: RecordBuilder;
}

export class PointerBuilder extends TypeBuilder<PointerBuilderState> {
  dehydrate(): dehydrated.Pointer {
    return {
      type: "Pointer",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.record.dehydrate()
    };
  }
}

//// Primitive ////

export interface PrimitiveBuilderState {
  name: string;
  args: JSONValue | undefined;
  base?: { name: string; args: JSONValue | undefined };
}

export class PrimitiveBuilder extends TypeBuilder<PrimitiveBuilderState> {
  dehydrate(): dehydrated.Primitive {
    return {
      type: "Primitive",
      name: this.state.name,
      args: this.state.args,
      base: this.state.base
    };
  }
}

///// Record ////
export interface RecordState {
  name: string;
  metadata: JSONObject | null;
  inner: DictionaryImpl;
}
