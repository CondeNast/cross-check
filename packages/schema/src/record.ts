import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option } from "ts-std";
import { builder, resolved } from "./descriptors";
import { TypeBuilder } from "./type";
import {
  DictionaryImpl,
  OptionalityType,
  TypeBuilderImpl,
  buildMembers
} from "./types/fundamental";
import { baseType } from "./types/fundamental/refined";
import { applyFeatures } from "./types/std/walk";

export class RecordBuilder<R extends builder.Record = builder.Record>
  extends TypeBuilderImpl<R>
  implements Record {
  get name(): string {
    return this.descriptor.name;
  }

  get metadata(): Option<JSONObject> {
    return this.descriptor.metadata;
  }

  get draft(): Record {
    let inner = baseType(this.descriptor);
    return new RecordBuilder(inner);
  }

  withFeatures(features: string[]): Record {
    let record = applyFeatures(this.descriptor, features);
    return new RecordBuilder(record);
  }

  build(): RecordImpl {
    return buildRecord(this);
  }
}

export class RecordImpl extends DictionaryImpl<resolved.Dictionary> {
  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }
}

export function buildRecord(record: Record): RecordImpl {
  return builder.instantiate(record.descriptor, true) as RecordImpl;
}

export interface RecordOptions {
  fields: Dict<TypeBuilder>;
  metadata?: JSONObject;
}

export function Record(
  name: string,
  { fields, metadata = null }: RecordOptions
): Record {
  let members = buildMembers(fields);

  return new RecordBuilder(
    builder.Record({
      members,
      metadata,
      impl: RecordImpl,
      name,
      args: null,
      OptionalityType
    })
  );
}

export interface Record extends TypeBuilder<builder.Record> {
  readonly name: string;
  readonly metadata: Option<JSONObject>;
  readonly draft: Record;
  withFeatures(featureList: string[]): Record;
  build(): RecordImpl;
}
