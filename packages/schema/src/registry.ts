import { Dict, JSONObject, Option, assert, dict, expect } from "ts-std";
import { dehydrated } from "./descriptors";
import { RecordBuilder, RecordImpl } from "./record";
import * as type from "./type";
import { DictionaryImpl } from "./types/fundamental";
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

class Aliased<T extends dehydrated.Descriptor> implements Copy {
  constructor(readonly descriptor: T) {}

  copy(): this {
    return new Aliased(Object.assign({}, this.descriptor) as T) as this;
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

type RegisteredTypeMap = {
  readonly [P in keyof RegistryValues]: Type<RegistryValues[P] & Copy>
};

interface RegistryValues {
  Record: Record;
  List: Aliased<dehydrated.List>;
  Pointer: Aliased<dehydrated.Pointer>;
  Iterator: Aliased<dehydrated.Iterator>;
  Dictionary: Aliased<dehydrated.Dictionary>;
  PrimitiveFactory: Primitive;
}

export type RegistryName = "List" | "Pointer" | "Iterator" | "Dictionary";

export type RegistryValue =
  | dehydrated.List
  | dehydrated.Pointer
  | dehydrated.Iterator
  | dehydrated.Dictionary;

export interface TypeID<K extends RegistryName> {
  type: K;
  name: string;
}

export class Registry {
  static create(): Registry {
    return new Registry();
  }

  private constructor(
    private types: RegisteredTypeMap = TYPES(),
    private base: Type<Base> = new Type()
  ) {}

  clone(): Registry {
    let types = {
      Record: this.types.Record.copy(),
      List: this.types.List.copy(),
      Pointer: this.types.Pointer.copy(),
      Iterator: this.types.Iterator.copy(),
      Dictionary: this.types.Dictionary.copy(),
      PrimitiveFactory: this.types.PrimitiveFactory.copy()
    };

    return new Registry(types, this.base.copy());
  }

  register(record: RecordBuilder): void {
    this.setRecord(record.name, record.members, record.metadata);
  }

  setRecord(
    name: string,
    dictionary: dehydrated.Dictionary,
    metadata: JSONObject | null
  ): void {
    assert(
      this.types.Record.get(name) === null,
      `record:${name} was already registered. You should only register a record once.`
    );

    this.types.Record.set(name, new Record(name, dictionary, metadata));
  }

  getRecordImpl(
    name: string,
    params: dehydrated.HydrateParameters
  ): RecordImpl {
    let { dictionary, metadata } = this.getRecord(name, params);
    return new RecordImpl(dictionary, metadata, name);
  }

  getRecord(
    name: string,
    params: dehydrated.HydrateParameters
  ): { name: string; dictionary: DictionaryImpl; metadata: JSONObject | null } {
    let { dictionary: raw, metadata } = this.getRawRecord(name);

    let dictionary = dehydrated.hydrate(raw, this, params);

    return {
      name,
      dictionary,
      metadata
    };
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
    assert(
      this.types.PrimitiveFactory.get(name) === null,
      `primitive:${name} was already registered. You should only register a record once.`
    );

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

  set<K extends RegistryName, V extends RegistryValue>(
    id: TypeID<K>,
    value: V
  ): void {
    let types: Type<Aliased<RegistryValue>> = this.types[id.type];
    types.set(id.name, new Aliased(value));
  }

  get<K extends RegistryName>(id: TypeID<K>): RegistryValue {
    let types = this.types[id.type];
    return expect(
      types.get(id.name),
      `Expected ${id.type}:${id.name} to be registered, but it was not`
    ).descriptor;
  }
}

export const REGISTRY = Registry.create();
