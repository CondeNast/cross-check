import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option } from "ts-std";
import { registered } from "./descriptors";
import { REGISTRY, Registry } from "./registry";
import * as visitor from "./types/describe/visitor";
import { DictionaryImpl } from "./types/fundamental";

export interface RecordState {
  name: string;
}

export class RegisteredRecord {
  constructor(readonly inner: registered.Record, readonly registry: Registry) {}

  get name(): string {
    return this.inner.state.name;
  }

  get descriptor(): visitor.Record {
    return this.inner.visitor(this.registry);
  }

  get type(): registered.Named {
    return new registered.Named({
      target: "Dictionary",
      name: this.inner.state.name
    });
  }

  get draft(): RegisteredRecord {
    return new RegisteredRecord(
      this.inner.runtime({ draft: true }),
      this.registry
    );
  }

  withFeatures(_features: string[]): RegisteredRecord {
    throw new Error("Not implememented");
    // let record = applyFeatures(this.descriptor, features);
    // return new RecordBuilder(record);
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.instantiated.validation()), null, env);
  }

  parse(value: Dict): Option<Dict> {
    return this.instantiated.parse(value);
  }

  serialize(value: Dict): Option<Dict> {
    return this.instantiated.serialize(value);
  }

  private get instantiated(): DictionaryImpl {
    return this.inner.instantiate(this.registry);
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

  registry.setRecord(name, dictionary, metadata);
  return new RegisteredRecord(registry.getRecord(name), registry);
}

export type Record = RegisteredRecord;
