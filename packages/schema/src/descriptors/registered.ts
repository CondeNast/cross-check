import { Dict, JSONObject, Option, dict, expect, unknown } from "ts-std";
import * as type from "../type";
import * as visitor from "../types/describe/visitor";
import { JSONValue, mapDict } from "../utils";
import * as dehydrated from "./dehydrated";
import * as resolved from "./resolved";

export interface TypeMetadata {
  features: Option<string[]>;
  required: Option<boolean>;
}

export function finalizeMeta(type: RegisteredType): MembersMeta {
  return {
    features: type.meta.features || undefined,
    required: type.meta.required || false
  }
}

export interface TypeState<State = unknown> {
  state: State;
  meta: TypeMetadata;
}

export const DEFAULT_TYPE_METADATA = {
  features: null,
  required: false
}

export type TypeMap<State> = (state: TypeState<State>) => TypeState<State>;

interface RegisteredTypeConstructor<T extends RegisteredType> {
  new(state: T["typeState"]): T;
}

export function mapMeta<T extends RegisteredType>(type: T, callback: (meta: TypeMetadata) => TypeMetadata): T {
  let mapped = callback(type.typeState.meta);
  return type.construct({ ...type.typeState, meta: mapped });
}

export function mapState<T extends RegisteredType>(type: T, callback: (state: T["typeState"]["state"]) => T["typeState"]["state"]): T {
  let mapped = callback(type.typeState.state);
  return type.construct({ state: mapped, meta: type.typeState.meta });
}

export abstract class RegisteredType<State = unknown> {
  readonly typeState: TypeState<State>;

  constructor(state: State, meta: TypeMetadata = DEFAULT_TYPE_METADATA) {
    this.typeState = { state, meta };
  }

  construct(state: this["typeState"]): this {
    let Class = this.constructor as RegisteredTypeConstructor<this>;

    return new Class(state);
  }

  required(isRequiredType?: boolean): RegisteredType<State> {
    return mapMeta(this, typeMetadata => ({ ...typeMetadata, required: isRequiredType === undefined ? null : isRequiredType }));
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
  abstract resolve(registry: Registry): resolved.Descriptor;
  abstract visitor(registry: Registry): visitor.Descriptor;
}

export interface TypeBuilderConstructor<State> {
  new(state: State, meta: TypeMetadata): RegisteredType<State>;
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
        meta: finalizeMeta(this)
      };
    });

    return {
      type: "Dictionary",
      members
    }
  }

  resolve(registry: Registry): resolved.Dictionary {
    return {
      type: "Dictionary",
      members: mapDict(this.state.members, member => member.resolve(registry))
    };
  }

  visitor(registry: Registry): visitor.Dictionary {
    return {
      type: "Dictionary",
      members: mapDict(this.state.members, member => {
        return {
          descriptor: member.visitor(registry),
          meta: finalizeMeta(this)
        }
      })
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
  base(): Iterator {
    // There's nothing to propagate, since the inner is just a pointer. The code that dereferences
    // it into a real Record should ask for its base type if that's what they want.
    return this;
  }

  dehydrate(): dehydrated.Iterator {
    return {
      type: "Iterator",
      kind: this.state.kind,
      metadata: this.state.metadata,
      inner: this.state.contents.dehydrate()
    }
  }

  resolve(registry: Registry): resolved.Iterator {
    return {
      type: "Iterator",
      inner: this.state.contents.resolve(registry)
    }
  }

  visitor(): visitor.Iterator {
    return {
      type: "Iterator",
      name: this.state.contents.state.name,
      inner: this.state.contents.visitor()
    }
  }
}

//// List ////

export interface ListState {
  args: resolved.ListArgs;
  contents: RegisteredType;
}

export class List extends RegisteredType<ListState> {
  dehydrate(): dehydrated.List {
    return {
      type: "List",
      args: this.state.args,
      inner: this.state.contents.dehydrate()
    }
  }

  resolve(registry: Registry): resolved.List {
    return {
      type: "List",
      inner: this.state.contents.resolve(registry),
      args: this.state.args
    }
  }

  visitor(registry: Registry): visitor.List {
    return {
      type: "List",
      inner: this.state.contents.visitor(registry),
      args: this.state.args
    }
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
    }
  }

  resolve(registry: Registry): resolved.Descriptor {
    let type = registry.get({ type: this.state.target, name: this.state.name }).type;
    return type.resolve(registry);
  }

  visitor(): visitor.Alias {
    return {
      type: "Alias",
      target: this.state.target,
      name: this.state.name
    }
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
    }
  }

  resolve(registry: Registry): resolved.Descriptor {
    return {
      type: "Pointer",
      inner: this.state.contents.resolve(registry)
    }
  }

  visitor(): visitor.Pointer {
    return {
      type: "Pointer",
      name: this.state.contents.state.name,
      inner: this.state.contents.visitor()
    };
  }
}

//// Primitive ////

export interface PrimitiveState {
  name: string;
  description: string;
  typescript: string;
  args: JSONValue | undefined;
}

export interface PrimitiveRegistration<Args extends JSONValue | undefined = JSONValue | undefined> {
  name: string;
  description: string;
  typescript: string;
  factory: type.PrimitiveFactory<Args>
}

export class Primitive extends RegisteredType<PrimitiveState> {
  dehydrate(): dehydrated.Named {
    return {
      type: "Named",
      target: "Primitive",
      name: this.state.name,
      args: this.state.args
    }
  }

  resolve(): resolved.Primitive {
    return {
      type: "Primitive",
      args: this.state.args
    };
  }

  visitor(): visitor.Primitive {
    return {
      type: "Primitive",
      name: this.state.name,
      args: this.state.args,
      description: this.state.description,
      typescript: this.state.typescript
    }
  }
}

///// Record ////
export interface RecordState {
  name: string;
  inner: Dictionary;
}

export class Record extends RegisteredType<RecordState> {
  dehydrate(): dehydrated.Named {
    return {
      type: "Named",
      target: "Dictionary",
      name: this.state.name
    };
  }

  resolve(registry: Registry): resolved.Dictionary {
    let inner = this.state.inner.resolve(registry);
    return {
      type: "Dictionary",
      members: inner.members
    };
  }

  visitor(registry: Registry): visitor.Record {
    let inner = this.state.inner.visitor(registry);

    return {
      type: "Record",
      name: this.state.name,
      members: inner.members,
      metadata: registry.getRecord(this.state.name).metadata
    }
  }
}

/***** Convenience Aliases *****/

export type Container = Iterator | Pointer | List;

/***** Registry *****/

export interface Registered<T> {
  type: T;
  metadata: JSONObject | null;
}

class Type<T> {
  readonly instances: Dict<Registered<T>> = dict();

  set(name: string, value: T, metadata: JSONObject | null): void {
    this.instances[name] = { type: value, metadata };
  }

  get(name: string): Option<Registered<T>> {
    return this.instances[name] || null;
  }
}

function TYPES(): RegisteredTypeMap {
  return {
    Record: new Type(),
    List: new Type(),
    Pointer: new Type(),
    Iterator: new Type(),
    Dictionary: new Type(),
    PrimitiveFactory: new Type()
  }
}

export type RegistryName = "List" | "Pointer" | "Iterator" | "Dictionary";

type RegisteredTypeMap = { readonly [P in keyof RegistryValue]: Type<RegistryValue[P]> };

export interface RegistryValue {
  Record: Record;
  List: List;
  Pointer: Pointer;
  Iterator: Iterator;
  Dictionary: Dictionary;
  PrimitiveFactory: PrimitiveRegistration;
}

export interface TypeID<K extends RegistryName> {
  type: K;
  name: string;
}

export class Registry {
  private types: RegisteredTypeMap = TYPES();
  private base = new Type<PrimitiveRegistration>();

  setRecord(name: string, record: Record, metadata: JSONObject | null) {
    this.types.Record.set(name, record, metadata);
  }

  getRecord(name: string): Registered<Record> {
    return expect(this.types.Record.get(name), `Expected record:${name} to be registered, but it wasn't`);
  }

  setPrimitive(name: string, primitive: PrimitiveRegistration, base?: PrimitiveRegistration): void {
    this.types.PrimitiveFactory.set(name, primitive, null);

    if (base !== undefined) {
      this.base.set(name, base, null);
    }
  }

  getPrimitive(name: string): PrimitiveRegistration {
    return expect(this.types.PrimitiveFactory.get(name), `Expected primitive:${name} to be registered, but it was not`).type;
  }

  getBase(name: string): PrimitiveRegistration {
    let base = this.base.get(name);

    if (base) {
      return base.type;
    } else {
      return this.getPrimitive(name);
    }
  }

  set<K extends RegistryName>(id: TypeID<K>, value: RegistryValue[K], metadata?: JSONObject): void {
    let types: Type<RegistryValue[K]> = this.types[id.type];
    types.set(id.name, value, metadata || null);
  }

  get<K extends RegistryName>(id: TypeID<K>): Registered<RegisteredType> {
    let types = this.types[id.type];
    return expect(types.get(id.name), `Expected ${id.type}:${id.name} to be registered, but it was not`);
  }
}

export const REGISTRY = new Registry();
