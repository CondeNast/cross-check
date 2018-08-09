import { Dict, JSONObject, Option, unknown } from "ts-std";
import { Registry, RegistryName } from "../registry";
import { Type } from "../type";
import {
  DictionaryImpl,
  IteratorImpl,
  ListImpl,
  OptionalityType,
  PointerImpl
} from "../types";
import * as visitor from "../types/describe/visitor";
import { JSONValue, mapDict } from "../utils";
import * as dehydrated from "./dehydrated";
import * as resolved from "./resolved";

export interface TypeMetadata {
  features: Option<string[]>;
  required: Option<boolean>;
}

export function finalizeMeta(registeredType: RegisteredType): MembersMeta {
  return {
    features: registeredType.meta.features || undefined,
    required: registeredType.meta.required || false
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
  new (state: T["state"], meta: TypeMetadata): T;
}

export function mapMeta<T extends RegisteredType>(
  registeredType: T,
  callback: (meta: TypeMetadata) => TypeMetadata
): T {
  let mapped = callback(registeredType.typeState.meta);
  return registeredType.construct({
    state: registeredType.typeState.state,
    meta: mapped
  });
}

export function mapState<T extends RegisteredType>(
  registeredType: T,
  callback: (state: T["typeState"]["state"]) => T["typeState"]["state"]
): T {
  let mapped = callback(registeredType.typeState.state);
  return registeredType.construct({
    state: mapped,
    meta: registeredType.typeState.meta
  });
}

export interface RuntimeParameters {
  draft?: boolean;
  features?: string[];
}

export abstract class RegisteredType<State = unknown> {
  readonly typeState: TypeState<State>;

  constructor(state: State, meta: TypeMetadata = DEFAULT_TYPE_METADATA) {
    this.typeState = { state, meta };
  }

  construct(state: this["typeState"]): this {
    let Class = this.constructor as RegisteredTypeConstructor<this>;

    return new Class(state.state, state.meta);
  }

  required(isRequiredType?: boolean): RegisteredType<State> {
    return mapMeta(this, typeMetadata => ({
      ...typeMetadata,
      required: isRequiredType === undefined ? true : isRequiredType
    }));
  }

  features(features: string[]): RegisteredType<State> {
    return mapMeta(this, typeMetadata => ({ ...typeMetadata, features }));
  }

  get state() {
    return this.typeState.state;
  }

  get meta() {
    return this.typeState.meta;
  }

  abstract dehydrate(): dehydrated.Descriptor;
  abstract instantiate(registry: Registry): Type;
  abstract visitor(registry: Registry): visitor.Descriptor;
  abstract runtime(parameters: RuntimeParameters): RegisteredType;
}

export interface TypeBuilderConstructor<State> {
  new (state: State, meta: TypeMetadata): RegisteredType<State>;
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

  instantiate(registry: Registry): DictionaryImpl {
    return new DictionaryImpl(
      mapDict(
        this.state.members,
        member =>
          new OptionalityType(member.instantiate(registry), {
            isOptional: !member.meta.required
          })
      )
    );
  }

  visitor(registry: Registry): visitor.Dictionary {
    return {
      type: "Dictionary",
      members: mapDict(this.state.members, member => {
        return {
          descriptor: member.visitor(registry),
          meta: finalizeMeta(member)
        };
      })
    };
  }

  runtime(parameters: RuntimeParameters): Dictionary {
    if (parameters.draft === true) {
      let members = mapDict(this.state.members, member =>
        member.runtime(parameters).required(false)
      );

      return new Dictionary({ members });
    } else {
      return this;
    }
  }
}

//// Iterator ////

export interface IteratorState {
  kind: string;
  metadata: JSONObject | null;
  contents: Named;
}

export class Iterator extends RegisteredType<IteratorState> {
  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.contents.dehydrate()
    };
  }

  instantiate(registry: Registry): IteratorImpl {
    return new IteratorImpl(this.state.contents.instantiate(registry));
  }

  visitor(): visitor.Iterator {
    return {
      type: "Iterator",
      inner: this.state.contents.visitor(),
      metadata: this.state.metadata,
      name: this.state.contents.state.name
    };
  }

  runtime(): Iterator {
    return this;
  }
}

//// List ////

export interface ListState {
  args: resolved.ListArgs;
  contents: RegisteredType;
}

export class List extends RegisteredType<ListState> {
  // constructor() {
  //   super(...arguments);

  //   if ("state" in this.typeState.state) debugger;
  // }
  dehydrate(): dehydrated.List {
    return {
      type: "List",
      args: this.state.args,
      inner: this.state.contents.dehydrate()
    };
  }

  instantiate(registry: Registry): ListImpl {
    return new ListImpl(
      this.state.contents.instantiate(registry),
      this.state.args
    );
  }

  visitor(registry: Registry): visitor.List {
    return {
      type: "List",
      inner: this.state.contents.visitor(registry),
      args: this.state.args
    };
  }

  runtime(): List {
    return this;
  }
}

//// Named ////

export interface NamedState {
  target: RegistryName;
  name: string;
  args?: {} | null;
}

export class Named extends RegisteredType<NamedState> {
  dehydrate(): dehydrated.Named {
    return {
      type: "Named",
      target: this.state.target,
      name: this.state.name,
      args: this.state.args
    };
  }

  instantiate(registry: Registry): Type {
    let type = registry.get({ type: this.state.target, name: this.state.name });
    return type.instantiate(registry);
  }

  visitor(): visitor.Alias {
    return {
      type: "Alias",
      target: this.state.target,
      name: this.state.name
    };
  }

  runtime(): RegisteredType {
    return this;
  }
}

export interface PointerState {
  kind: string;
  metadata: JSONObject | null;
  contents: Named;
}

export class Pointer extends RegisteredType<PointerState> {
  dehydrate(): dehydrated.Pointer {
    return {
      type: "Pointer",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.contents.dehydrate()
    };
  }

  instantiate(registry: Registry): PointerImpl {
    return new PointerImpl(this.state.contents.instantiate(registry));
  }

  visitor(): visitor.Pointer {
    return {
      type: "Pointer",
      inner: this.state.contents.visitor(),
      metadata: this.state.metadata,
      name: this.state.contents.state.name
    };
  }

  runtime(): Pointer {
    return this;
  }
}

//// Primitive ////

export interface PrimitiveState {
  name: string;
  base?: { name: string; args: JSONValue | undefined };
  args: JSONValue | undefined;
}

export class Primitive extends RegisteredType<PrimitiveState> {
  dehydrate(): dehydrated.Primitive {
    return {
      type: "Primitive",
      name: this.state.name,
      args: this.state.args
    };
  }

  instantiate(registry: Registry): Type {
    let primitive = registry.getPrimitive(this.state.name);
    return primitive.factory(this.state.args);
  }

  resolve(): resolved.Primitive {
    return {
      type: "Primitive",
      name: this.state.name,
      args: this.state.args
    };
  }

  visitor(registry: Registry): visitor.Primitive {
    let primitive = registry.getPrimitive(this.state.name);

    return {
      type: "Primitive",
      name: this.state.name,
      args: this.state.args,
      description: primitive.description,
      typescript: primitive.typescript
    };
  }

  runtime(parameters: RuntimeParameters): Primitive {
    if (parameters.draft === true && this.state.base) {
      return new Primitive(this.state.base, {
        required: false,
        features: this.meta.features
      });
    } else {
      return this;
    }
  }
}

///// Record ////
export interface RecordState {
  name: string;
  metadata: JSONObject | null;
  inner: Dictionary;
}

export class Record extends RegisteredType<RecordState> {
  dehydrate(): dehydrated.Record {
    return {
      type: "Record",
      name: this.state.name
    };
  }

  instantiate(registry: Registry): DictionaryImpl {
    return this.state.inner.instantiate(registry);
  }

  visitor(registry: Registry): visitor.Record {
    let inner = this.state.inner.visitor(registry);

    return {
      type: "Record",
      name: this.state.name,
      members: inner.members,
      metadata: registry.getRecord(this.state.name).state.metadata
    };
  }

  runtime(parameters: RuntimeParameters): Record {
    return new Record({
      name: this.state.name,
      metadata: this.state.metadata,
      inner: this.state.inner.runtime(parameters)
    });
  }
}

/***** Convenience Aliases *****/

export type Container = Iterator | Pointer | List;
