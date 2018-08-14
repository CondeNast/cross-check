import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option, unknown } from "ts-std";
import { RecordBuilder } from "../record";
import { REGISTRY, Registry, RegistryName } from "../registry";
import { Type } from "../type";
import {
  DictionaryImpl,
  IteratorImpl,
  ListImpl,
  OptionalityImpl,
  PointerImpl
} from "../types";
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

interface RegisteredTypeConstructor<T extends RegisteredType> {
  new (state: T["state"]): T;
}

export function mapMeta<T extends TypeBuilder>(
  registeredType: T,
  callback: (meta: TypeMetadata) => TypeMetadata
): T {
  let mapped = callback(registeredType.meta);
  return registeredType.construct(registeredType.state, mapped);
}

export function mapState<T extends RegisteredType>(
  registeredType: T,
  callback: (state: T["state"]) => T["state"]
): T {
  let mapped = callback(registeredType.state);
  return registeredType.construct(mapped);
}

export abstract class RegisteredType<State = unknown> {
  constructor(readonly state: State) {}

  construct(state: this["state"]): this {
    let Class = this.constructor as RegisteredTypeConstructor<this>;

    return new Class(state);
  }

  copy(): this {
    return this.construct(this.state);
  }

  abstract instantiate(registry: Registry): Type;
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

export interface DictionaryState {
  members: Dict<RegisteredType>;
}

export class Dictionary extends RegisteredType<DictionaryState> {
  // TODO: Does this really need the registry? Or should it instead be
  // done in hydrate?
  instantiate(registry: Registry): DictionaryImpl {
    return new DictionaryImpl(
      mapDict(this.state.members, member => member.instantiate(registry))
    );
  }
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

export interface IteratorState {
  kind: string;
  metadata: JSONObject | null;
  record: Record;
}

export class Iterator extends RegisteredType<IteratorState> {
  instantiate(registry: Registry): IteratorImpl {
    return new IteratorImpl(this.state.record.instantiate(registry));
  }
}

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

export interface ListState {
  args: resolved.ListArgs;
  contents: RegisteredType;
}

export class List extends RegisteredType<ListState> {
  instantiate(registry: Registry): ListImpl {
    return new ListImpl(
      this.state.contents.instantiate(registry),
      this.state.args
    );
  }
}

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

export interface NamedState {
  target: RegistryName;
  name: string;
  args?: {} | null;
}

export class Named extends RegisteredType<NamedState> {
  instantiate(registry: Registry): Type {
    let type = registry.get({ type: this.state.target, name: this.state.name });
    return type.instantiate(registry);
  }
}

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

//// Optionality ////
export interface OptionalityState {
  optional: boolean;
  inner: RegisteredType;
}

export class Optionality extends RegisteredType<OptionalityState> {
  instantiate(registry: Registry): OptionalityImpl {
    return new OptionalityImpl(this.state.inner.instantiate(registry), {
      isOptional: this.state.optional
    });
  }
}

//// Pointer ////

export interface PointerState {
  kind: string;
  metadata: JSONObject | null;
  record: Record;
}

export class Pointer extends RegisteredType<PointerState> {
  instantiate(registry: Registry): PointerImpl {
    return new PointerImpl(this.state.record.instantiate(registry));
  }
}

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

export interface PrimitiveState {
  name: string;
  args: JSONValue | undefined;
  required: boolean;
}

export class Primitive extends RegisteredType<PrimitiveState> {
  instantiate(registry: Registry): Type {
    let { factory, buildArgs } = registry.getPrimitive(this.state.name);
    let args = buildArgs
      ? buildArgs(this.state.args, this.state.required)
      : this.state.args;

    return factory(args);
  }
}

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
  inner: Dictionary;
}

export class Record extends RegisteredType<RecordState> {
  instantiate(registry: Registry): DictionaryImpl {
    return this.state.inner.instantiate(registry);
  }

  validate(
    obj: Dict,
    env: Environment,
    registry: Registry = REGISTRY
  ): Task<ValidationError[]> {
    let instance = this.instantiate(registry);
    let validation = instance.validation();

    return validate(obj, build(validation), null, env);
  }

  parse(value: Dict, registry = REGISTRY): unknown {
    return this.instantiate(registry).parse(value);
  }

  serialize(value: Dict, registry = REGISTRY): unknown {
    return this.instantiate(registry).serialize(value);
  }
}

/***** Convenience Aliases *****/

export type Container = Iterator | Pointer | List;
