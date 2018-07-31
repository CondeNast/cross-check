import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option, unknown } from "ts-std";
import { builder } from "./descriptors";
import {
  DictionaryImpl,
  Type,
  TypeBuilder,
  buildMembers
} from "./types/fundamental";
import { baseType } from "./types/fundamental/refined";
import { applyFeatures } from "./types/std/walk";

class RecordBuilder extends TypeBuilder<builder.Record> implements Record {
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

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.build().validation()), null, env);
  }

  parse(value: unknown): unknown {
    return this.build().parse(value);
  }

  serialize(value: unknown): unknown {
    return this.build().serialize(value);
  }

  private build(): Type {
    return builder.instantiate(this.descriptor, true);
  }
}

export interface RecordOptions {
  fields: Dict<TypeBuilder>;
  metadata?: JSONObject;
}

export function Record(
  name: string,
  { fields, metadata = null }: RecordOptions
): Record {
  let { members, membersMeta } = buildMembers(fields);

  return new RecordBuilder(
    builder.Record(members, membersMeta, metadata, DictionaryImpl, name)
  );
}

export interface Record extends TypeBuilder<builder.Record> {
  readonly name: string;
  readonly draft: Record;
  withFeatures(featureList: string[]): Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
  parse(value: unknown): unknown;
  serialize(value: unknown): unknown;
}
