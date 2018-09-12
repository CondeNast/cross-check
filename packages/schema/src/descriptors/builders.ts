import { Dict, JSONObject, Option } from "ts-std";
import { RegistryName } from "../registry";
import { DictionaryType, ListArgs } from "../types";
import { JSONValue, mapDict } from "../utils";
import * as dehydrated from "./dehydrated";

export interface TypeMetadata {
  features: Option<string[]>;
  required: Option<dehydrated.Required>;
  mutabilityMode: Option<
    dehydrated.MutabilityMode | dehydrated.MutabilityShorthand
  >;
}

export function finalizeMeta(meta: TypeMetadata): MembersMeta {
  return {
    features: meta.features || undefined,
    mutabilityMode: meta.mutabilityMode
      ? dehydrated.mutabilityMode(meta.mutabilityMode)
      : undefined
  };
}

export interface TypeState<State = unknown> {
  state: State;
  meta: TypeMetadata;
}

export const DEFAULT_TYPE_METADATA: TypeMetadata = {
  features: null,
  required: null,
  mutabilityMode: null
};

export type TypeMap<State> = (state: TypeState<State>) => TypeState<State>;

export function mapMeta<T extends AbstractTypeBuilder>(
  builder: T,
  callback: (meta: TypeMetadata) => TypeMetadata
): T {
  let mapped = callback(builder.meta);
  return builder.construct(builder.state, mapped);
}

export interface TypeBuilderMember {
  readonly builder: TypeBuilder;
}

export interface TypeBuilder extends TypeBuilderMember {
  readonly meta: TypeMetadata;
  required(declaration?: boolean | dehydrated.Required): TypeBuilder;
  features(features: string[]): TypeBuilder;
  readonly(): TypeBuilder;
  writable(options: { on: "create" | "update" }): TypeBuilder;
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Descriptor;
}

export abstract class AbstractTypeBuilder<State = unknown>
  implements AbstractTypeBuilder, TypeBuilderMember {
  constructor(
    readonly state: State,
    readonly meta: TypeMetadata = DEFAULT_TYPE_METADATA
  ) {}

  get builder(): TypeBuilder {
    return this;
  }

  construct(state: State, meta: this["meta"]): this {
    let Class = this.constructor as TypeBuilderConstructor<this>;
    return new Class(state, meta) as this;
  }

  required(declaration?: boolean | dehydrated.Required): TypeBuilder {
    return mapMeta(this, typeMetadata => ({
      ...typeMetadata,
      required: required(declaration)
    }));
  }

  features(features: string[]): TypeBuilder {
    return mapMeta(this, typeMetadata => ({ ...typeMetadata, features }));
  }

  readonly(): TypeBuilder {
    return mapMeta(this, typeMetadata => ({
      ...typeMetadata,
      mutabilityMode: "read"
    }));
  }

  writable(options: { on: "create" | "update" }): TypeBuilder {
    return mapMeta(this, typeMetadata => {
      let mutabilityMode = {
        ...dehydrated.READONLY,
        [options.on]: true
      };

      return {
        ...typeMetadata,
        mutabilityMode
      };
    });
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

export interface TypeBuilderConstructor<B extends AbstractTypeBuilder> {
  new (state: B["state"], meta: TypeMetadata): AbstractTypeBuilder;
}

/***** Concrete Builders *****/

//// Dictionary ////

export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
}

export interface DictionaryBuilderState {
  members: Dict<TypeBuilderMember>;
}

export class DictionaryBuilder extends AbstractTypeBuilder<
  DictionaryBuilderState
> {
  dehydrate(isRequiredPosition: dehydrated.Required): dehydrated.Dictionary {
    let members = mapDict(this.state.members, member => {
      let builder = member.builder;
      return {
        descriptor: builder.dehydrate("never"),
        meta: finalizeMeta(builder.meta)
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

export class IteratorBuilder extends AbstractTypeBuilder<IteratorBuilderState> {
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

export class ListBuilder extends AbstractTypeBuilder<ListBuilderState> {
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
  target: RegistryName | "Record";
  name: string;
  args?: {} | null;
}

export class NamedBuilder extends AbstractTypeBuilder<NamedBuilderState> {
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

export class PointerBuilder extends AbstractTypeBuilder<PointerBuilderState> {
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

export class PrimitiveBuilder extends AbstractTypeBuilder<
  PrimitiveBuilderState
> {
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
  inner: DictionaryType;
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
