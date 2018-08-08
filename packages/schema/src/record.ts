import { Dict, JSONObject } from "ts-std";
import { registered } from "./descriptors";
import { REGISTRY, Registry } from "./descriptors/registered";
import * as visitor from "./types/describe/visitor";

export interface RecordState {
  name: string;
}

export class RegisteredRecord {
  constructor(readonly inner: registered.Record, _registry: Registry) { }

  get name(): string {
    return this.inner.state.name;
  }

  get descriptor(): visitor.Record {
    return this.inner.visitor(REGISTRY);
  }

  get type(): registered.Named {
    return new registered.Named({
      target: "Dictionary",
      name: this.inner.state.name
    })
  }

  get draft(): RegisteredRecord {
    throw new Error("Not implememented");
    // let inner = baseType(this.descriptor);
    // return new RecordBuilder(inner, this.meta);
  }

  withFeatures(_features: string[]): RegisteredRecord {
    throw new Error("Not implememented");
    // let record = applyFeatures(this.descriptor, features);
    // return new RecordBuilder(record);
  }
}

export interface RecordOptions {
  fields: Dict<registered.RegisteredType>;
  metadata?: JSONObject;
  registry?: Registry;
}

export function Record(
  name: string,
  { fields, metadata = null, registry = REGISTRY }: RecordOptions
): RegisteredRecord {
  let dictionary = new registered.Dictionary({
    members: fields
  });

  let recordBuilder = new registered.Record({ name, inner: dictionary })
  REGISTRY.setRecord(name, recordBuilder, metadata);
  return new RegisteredRecord(recordBuilder, registry);
}

export type Record = RegisteredRecord;
