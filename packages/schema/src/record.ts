import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option } from "ts-std";
import { builder, dehydrated, resolved } from "./descriptors";
import { REGISTRY } from "./descriptors/builder";
import { DictionaryImpl } from "./types/fundamental";

export interface RecordState {
  name: string;
}

export class RecordBuilder extends builder.TypeBuilder<RecordState> implements Record {
  get name(): string {
    return this.state.name;
  }

  dehydrate(): dehydrated.Descriptor {
    return {
      type: "Named",
      target: "Dictionary",
      name: this.state.name
    }
  }

  get draft(): Record {
    throw new Error("Not implememented");
    // let inner = baseType(this.descriptor);
    // return new RecordBuilder(inner, this.meta);
  }

  withFeatures(features: string[]): Record {
    throw new Error("Not implememented");
    // let record = applyFeatures(this.descriptor, features);
    // return new RecordBuilder(record);
  }
}

export class RecordImpl extends DictionaryImpl<resolved.Dictionary> {
  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }
}

export interface RecordOptions {
  fields: Dict<builder.TypeBuilder>;
  metadata?: JSONObject;
}

export function Record(
  name: string,
  { fields, metadata = null }: RecordOptions
): Record {
  REGISTRY.record(name, fields, metadata);
  return new RecordBuilder({
    name
  })
}

export interface Record extends builder.TypeBuilder<RecordState> {
  readonly name: string;
  readonly draft: Record;
  withFeatures(featureList: string[]): Record;
}
