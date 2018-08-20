import { Dict, JSONObject, Option } from "ts-std";
import { RegistryName } from "../registry";
import { DictionaryImpl, ListArgs } from "../types";
import { JSONValue, mapDict } from "../utils";
import * as dehydrated from "./dehydrated";

export interface TypeMetadata {
  features: Option<string[]>;
  required: Option<dehydrated.Required>;
}

export function finalizeMeta(typeBuilder: TypeBuilder): MembersMeta {
  return {
    features: typeBuilder.meta.features || undefined
  };
}

export interface TypeState<State = unknown> {
  state: State;
  meta: TypeMetadata;
}

export const DEFAULT_TYPE_METADATA: TypeMetadata = {
  features: null,
  required: null
};

export type TypeMap<State> = (state: TypeState<State>) => TypeState<State>;

export function mapMeta<T extends TypeBuilder>(
  builder: T,
  callback: (meta: TypeMetadata) => TypeMetadata
): T {
  let mapped = callback(builder.meta);
  return builder.construct(builder.state, mapped);
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

  required(declaration?: boolean | dehydrated.Required): TypeBuilder<State> {
    return mapMeta(this, typeMetadata => ({
      ...typeMetadata,
      required: required(declaration)
    }));
  }

  features(features: string[]): TypeBuilder<State> {
    return mapMeta(this, typeMetadata => ({ ...typeMetadata, features }));
  }

  abstract dehydrate(
    isRequiredPosition: dehydrated.Required
  ): dehydrated.Descriptor;

  protected isRequired(isRequiredPosition: dehydrated.Required) {
    return this.meta.required === null
      ? isRequiredPosition
      : this.meta.required;
  }
}

export interface TypeBuilderConstructor<B extends TypeBuilder> {
  new (state: B["state"], meta: TypeMetadata): TypeBuilder;
}

/***** Concrete Builders *****/

//// Dictionary ////

export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
}

export interface DictionaryBuilderState {
  members: Dict<TypeBuilder>;
}

export class DictionaryBuilder extends TypeBuilder<DictionaryBuilderState> {
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Dictionary {
    let members = mapDict(this.state.members, member => {
      return {
        descriptor: member.dehydrate("never"),
        meta: finalizeMeta(member)
      };
    });

    return {
      type: "Dictionary",
      members,
      required:
        this.meta.required === null ? isRequiredPosition : this.meta.required
    };
  }
}

//// Iterator ////

export interface IteratorBuilderState {
  kind: string;
  metadata: JSONObject | null;
  record: string;
}

export class IteratorBuilder extends TypeBuilder<IteratorBuilderState> {
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.record,
      required:
        this.meta.required === null ? isRequiredPosition : this.meta.required
    };
  }
}

//// List ////

export interface ListBuilderState {
  args?: ListArgs;
  contents: TypeBuilder;
}

export class ListBuilder extends TypeBuilder<ListBuilderState> {
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.List {
    return {
      type: "List",
      args: this.state.args,
      inner: this.state.contents.dehydrate("published"),
      required:
        this.meta.required === null ? isRequiredPosition : this.meta.required
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
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Named {
    return {
      type: "Named",
      target: this.state.target,
      name: this.state.name,
      args: this.state.args,
      required: this.isRequired(isRequiredPosition)
    };
  }
}

//// Pointer ////

export interface PointerBuilderState {
  kind: string;
  metadata: JSONObject | null;
  record: string;
}

export class PointerBuilder extends TypeBuilder<PointerBuilderState> {
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Pointer {
    return {
      type: "Pointer",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.record,
      required: this.isRequired(isRequiredPosition)
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
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Primitive {
    return {
      type: "Primitive",
      name: this.state.name,
      args: this.state.args,
      base: this.state.base,
      required: this.isRequired(isRequiredPosition)
    };
  }
}

///// Record ////
export interface RecordState {
  name: string;
  metadata: JSONObject | null;
  inner: DictionaryImpl;
}

///// Helper Functions /////

function required(
  declaration: undefined | boolean | dehydrated.Required
): dehydrated.Required {
  if (typeof declaration === "string") {
    return declaration;
  } else if (declaration === undefined || declaration === true) {
    return "published";
  } else {
    return "never";
  }
}
