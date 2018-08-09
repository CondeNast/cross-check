import { Dict, JSONObject, Option, dict, expect, unknown } from "ts-std";
import { registered } from "./descriptors";
import * as type from "./type";
import { JSONValue } from "./utils";

export interface PrimitiveRegistration {
  name: string;
  description: string;
  typescript: string;
  base?: { name: string; args: JSONValue | undefined };
  factory: type.PrimitiveFactory<unknown>;
}

class Type<T> {
  readonly instances: Dict<T> = dict();

  set(name: string, value: T): void {
    this.instances[name] = value;
  }

  get(name: string): Option<T> {
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
  };
}

export type RegistryName = "List" | "Pointer" | "Iterator" | "Dictionary";

type RegisteredTypeMap = {
  readonly [P in keyof RegistryValue]: Type<RegistryValue[P]>
};

export interface RegistryValue {
  Record: RecordRegistration;
  List: registered.List;
  Pointer: registered.Pointer;
  Iterator: registered.Iterator;
  Dictionary: registered.Dictionary;
  PrimitiveFactory: PrimitiveRegistration;
}

export interface RecordRegistration {
  name: string;
  dictionary: registered.Dictionary;
  metadata: JSONObject | null;
}

export interface TypeID<K extends RegistryName> {
  type: K;
  name: string;
}

export class Registry {
  private types: RegisteredTypeMap = TYPES();
  private base = new Type<{ name: string; args: JSONValue | undefined }>();

  setRecord(
    name: string,
    dictionary: registered.Dictionary,
    metadata: JSONObject | null
  ) {
    this.types.Record.set(name, { name, dictionary, metadata });
  }

  getRecord(name: string): registered.Record {
    let registration = expect(
      this.types.Record.get(name),
      `Expected record:${name} to be registered, but it wasn't`
    );

    return new registered.Record({
      name,
      inner: registration.dictionary,
      metadata: registration.metadata
    });
  }

  setPrimitive(name: string, primitive: PrimitiveRegistration): void {
    this.types.PrimitiveFactory.set(name, primitive);
  }

  setBase(refined: string, base: string, args: JSONValue | undefined): void {
    this.base.set(refined, { name: base, args });
  }

  getPrimitive(name: string): PrimitiveRegistration {
    return expect(
      this.types.PrimitiveFactory.get(name),
      `Expected primitive:${name} to be registered, but it was not`
    );
  }

  getBase(name: string): PrimitiveRegistration {
    let base = this.base.get(name);

    if (base) {
      return this.getPrimitive(base.name);
    } else {
      return this.getPrimitive(name);
    }
  }

  set<K extends RegistryName>(id: TypeID<K>, value: RegistryValue[K]): void {
    let types: Type<RegistryValue[K]> = this.types[id.type];
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
