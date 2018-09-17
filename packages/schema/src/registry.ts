import { Dict, JSONObject, Option, assert, dict, expect } from "ts-std";
import { HydrateParameters, Hydrator, dehydrated } from "./descriptors";
import { RecordBuilder, RecordImpl } from "./record";
import * as type from "./type";
import { DictionaryType } from "./types";
import { JSONValue, mapDict } from "./utils";

export interface BasePrimitiveRegistration {
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

export interface DefaultPrimitiveRegistration
  extends BasePrimitiveRegistration {
  default: true;
}

export interface OverridePrimitiveRegistration
  extends BasePrimitiveRegistration {
  override: true;
}

export type PrimitiveRegistration =
  | DefaultPrimitiveRegistration
  | OverridePrimitiveRegistration;

export interface RecordRegistration {
  dictionary: dehydrated.Dictionary;
  metadata: JSONObject | null;
}

class Base implements Copy {
  constructor(readonly name: string, readonly args: JSONValue | undefined) { }

  copy(): this {
    return new Base(this.name, this.args) as this;
  }
}

class Record {
  constructor(
    readonly name: string,
    readonly dictionary: dehydrated.Dictionary,
    readonly metadata: JSONObject | null
  ) { }

  copy(): this {
    return new Record(this.name, this.dictionary, this.metadata) as this;
  }
}

class Primitive {
  constructor(readonly registration: PrimitiveRegistration) { }

  copy(): this {
    return new Primitive(this.registration) as this;
  }
}

class Aliased<T extends dehydrated.Descriptor> implements Copy {
  constructor(readonly descriptor: T) { }

  copy(): this {
    return new Aliased(Object.assign({}, this.descriptor) as T) as this;
  }
}

export interface Copy {
  copy(): this;
}

class Type<T extends Copy> implements Copy {
  constructor(readonly instances: Dict<T> = dict()) { }

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

class ReferenceType implements Copy {
  constructor(readonly instances: Dict<unknown> = dict()) { }

  set(name: string, value: unknown): void {
    this.instances[name] = value;
  }

  get(name: string): Option<unknown> {
    return this.instances[name] || null;
  }

  copy(): this {
    let instances = mapDict(this.instances, instance => instance);

    return new ReferenceType(instances) as this;
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

function copyTypes(types: Dict<Copy>): RegisteredTypeMap {
  return mapDict(types, member => member.copy()) as any;
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

export interface RegistryOptions {
  record?(name: string, registry: Registry): Option<RecordRegistration>;
  primitive?(name: string, registry: Registry): Option<PrimitiveRegistration>;
}

export type RegistryCallback = (
  name: string,
  registry: Registry
) => Option<{ dictionary: dehydrated.Dictionary; metadata: JSONObject | null }>;

export interface RegistryRecord {
  name: string;
  dictionary: DictionaryType;
  metadata: JSONObject | null;
}

export class Registry {
  static create(): Registry {
    return new Registry();
  }

  private constructor(
    private defaults: RegisteredTypeMap = TYPES(),
    private types: RegisteredTypeMap = TYPES(),
    private base: Type<Base> = new Type(),
    private other: ReferenceType = new ReferenceType(),
    private options: RegistryOptions | null = null
  ) { }

  clone(options?: RegistryOptions): Registry {
    return new Registry(
      copyTypes(this.defaults),
      copyTypes(this.types),
      this.base.copy(),
      this.other.copy(),
      options || this.options
    );
  }

  register(
    record: RecordBuilder,
    options: { default: true } | { override: true } = { default: true }
  ): void {
    this.setRecord(record.name, record.members, record.metadata, options);
  }

  registerPrimitive(name: string, primitive: PrimitiveRegistration): void {
    assert(
      this.types.PrimitiveFactory.get(name) === null,
      `primitive:${name} was already registered. You should only register a record once.`
    );

    if ("default" in primitive) {
      this.defaults.PrimitiveFactory.set(name, new Primitive(primitive));
    } else {
      this.types.PrimitiveFactory.set(name, new Primitive(primitive));
    }
  }

  registerOther(name: string, other: unknown): void {
    this.setOther(name, other);
  }

  alias<K extends RegistryName, V extends RegistryValue>(
    id: TypeID<K>,
    value: V,
    options: { default: true } | { override: true } = { default: true }
  ): void {
    let types: Type<Aliased<RegistryValue>>;

    if ("default" in options) {
      types = this.defaults[id.type];
    } else {
      types = this.types[id.type];
    }

    types.set(id.name, new Aliased(value));
  }

  getPrimitive(name: string): PrimitiveRegistration {
    let override = this.types.PrimitiveFactory.get(name);
    if (override) return override.registration;

    if (this.options && this.options.primitive) {
      let primitive = this.options.primitive(name, this);
      if (primitive) return primitive;
    }

    return expect(
      this.defaults.PrimitiveFactory.get(name),
      `primitive:${name} was not found`
    ).registration;
  }

  setRecord(
    name: string,
    dictionary: dehydrated.Dictionary,
    metadata: JSONObject | null,
    options: { default: true } | { override: true }
  ): void {
    if ("default" in options) {
      assert(
        this.types.Record.get(name) === null,
        `record:${name} was already registered as a default. You should only register a record once as an override.`
      );
    } else {
      assert(
        this.types.Record.get(name) === null,
        `record:${name} was already registered as an override. You should only register a record once as an override.`
      );
    }

    this.types.Record.set(name, new Record(name, dictionary, metadata));
  }

  setOther(name: string, other: unknown): void {
    this.other.set(name, other);
  }

  getRecordImpl(
    name: string,
    hydrator: Hydrator | HydrateParameters
  ): RecordImpl {
    let { dictionary, metadata } = this.getRecord(name, hydrator);
    return new RecordImpl(dictionary, metadata, name);
  }

  getRecord(
    name: string,
    hydrator: Hydrator | HydrateParameters
  ): RegistryRecord {
    let { dictionary: raw, metadata } = this.getRawRecord(name);

    let dictionary;
    if (hydrator instanceof Hydrator) {
      dictionary = hydrator.hydrate(raw);
    } else {
      let instance = new Hydrator(this, hydrator);
      dictionary = instance.hydrate(raw);
    }

    return {
      name,
      dictionary,
      metadata
    };
  }

  getRawRecord(
    name: string
  ): { dictionary: dehydrated.Dictionary; metadata: JSONObject | null } {
    let registered = this.types.Record.get(name);

    if (registered) return registered;

    if (this.options && this.options.record) {
      let result = this.options.record(name, this);
      if (result) return result;
    }

    let defaultRecord = this.defaults.Record.get(name);

    return expect(defaultRecord, `record:${name} wasn't found`);
  }

  getBase(name: string): PrimitiveRegistration {
    let base = this.base.get(name);

    if (base) {
      return this.getPrimitive(base.name);
    } else {
      return this.getPrimitive(name);
    }
  }

  getOther(name: string): unknown {
    let other = this.other.get(name);

    return expect(other, `other:${name} wasn't found`);
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
