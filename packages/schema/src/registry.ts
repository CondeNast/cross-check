import { Dict, JSONObject, Option, dict, expect, unknown } from "ts-std";
import { dehydrated, registered } from "./descriptors";
import * as type from "./type";
import { JSONValue, mapDict } from "./utils";

export interface PrimitiveRegistration {
  name: string;
  description: string;
  typescript: string;
  base?: { name: string; args: JSONValue | undefined };
  factory: type.PrimitiveFactory<unknown>;
  buildArgs?: (
    args: JSONValue | undefined,
    required: boolean
  ) => JSONValue | undefined;
}

export interface RecordRegistration {
  name: string;
  dictionary: dehydrated.Dictionary;
  metadata: JSONObject | null;
}

class Base implements Copy {
  constructor(readonly name: string, readonly args: JSONValue | undefined) {}

  copy(): this {
    return new Base(this.name, this.args) as this;
  }
}

class Record {
  constructor(
    readonly name: string,
    readonly dictionary: dehydrated.Dictionary,
    readonly metadata: JSONObject | null
  ) {}

  copy(): this {
    return new Record(this.name, this.dictionary, this.metadata) as this;
  }
}

class Primitive {
  constructor(readonly registration: PrimitiveRegistration) {}

  copy(): this {
    return new Primitive(this.registration) as this;
  }
}

export interface Copy {
  copy(): this;
}

class Type<T extends Copy> implements Copy {
  constructor(readonly instances: Dict<T> = dict()) {}

  set(name: string, value: T): void {
    this.instances[name] = value;
  }

  get(name: string): Option<T> {
    return this.instances[name] || null;
  }

  copy(): this {
    let instances = mapDict(this.instances, instance => instance.copy());

    return new Type(instances) as this;
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
  };
}

export type RegistryName = "List" | "Pointer" | "Iterator" | "Dictionary";

type RegisteredTypeMap = {
  readonly [P in keyof RegistryValues]: Type<RegistryValues[P] & Copy>
};

interface RegistryValues {
  Record: Record;
  List: registered.List;
  Pointer: registered.Pointer;
  Iterator: registered.Iterator;
  Dictionary: registered.Dictionary;
  PrimitiveFactory: Primitive;
}

export type RegistryValue =
  | registered.List
  | registered.Pointer
  | registered.Iterator
  | registered.Dictionary;

export interface TypeID<K extends RegistryName> {
  type: K;
  name: string;
}

export class Registry {
  private types: RegisteredTypeMap = TYPES();
  private base = new Type<Base>();

  // bootstrap(other: Registry): Registry {}

  setRecord(
    name: string,
    dictionary: dehydrated.Dictionary,
    metadata: JSONObject | null
  ) {
    this.types.Record.set(name, new Record(name, dictionary, metadata));
  }

  getRecord(
    name: string,
    params: dehydrated.HydrateParameters
  ): registered.Record {
    let { dictionary, metadata } = this.getRawRecord(name);

    let inner = dehydrated.hydrate(dictionary, this, params);

    return new registered.Record({
      name,
      inner,
      metadata
    });
  }

  getRawRecord(
    name: string
  ): { dictionary: dehydrated.Dictionary; metadata: JSONObject | null } {
    return expect(
      this.types.Record.get(name),
      `Expected record:${name} to be registered, but it wasn't`
    );
  }

  setPrimitive(name: string, primitive: PrimitiveRegistration): void {
    this.types.PrimitiveFactory.set(name, new Primitive(primitive));
  }

  setBase(refined: string, base: string, args: JSONValue | undefined): void {
    this.base.set(refined, new Base(base, args));
  }

  getPrimitive(name: string): PrimitiveRegistration {
    let primitive = expect(
      this.types.PrimitiveFactory.get(name),
      `Expected primitive:${name} to be registered, but it was not`
    );

    return primitive.registration;
  }

  getBase(name: string): PrimitiveRegistration {
    let base = this.base.get(name);

    if (base) {
      return this.getPrimitive(base.name);
    } else {
      return this.getPrimitive(name);
    }
  }

  set<K extends RegistryName>(id: TypeID<K>, value: RegistryValue): void {
    let types: Type<RegistryValues[K]> = this.types[id.type];
    types.set(id.name, value);
  }

  get<K extends RegistryName>(id: TypeID<K>): registered.RegisteredType {
    let types = this.types[id.type];
    return expect(
      types.get(id.name),
      `Expected ${id.type}:${id.name} to be registered, but it was not`
    );
  }
}

export const REGISTRY = new Registry();
