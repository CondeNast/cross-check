import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option, dict, entries } from "ts-std";
import { RecordDescriptor, TypeDescriptor, factory } from "./descriptors";
import {
  DictionaryImpl,
  Type,
  TypeBuilder,
  buildMembers,
  instantiate
} from "./types/fundamental";

class RecordImpl extends DictionaryImpl<RecordDescriptor> implements Record {
  constructor(readonly descriptor: RecordDescriptor) {
    super(descriptor);
  }

  get name(): string {
    return this.descriptor.name;
  }

  get fields(): Dict<Type> {
    let obj = dict<Type>();

    for (let [key, value] of entries(this.descriptor.members)) {
      obj[key] = instantiate(value!);
    }

    return obj;
  }

  get metadata(): Option<JSONObject> {
    return this.descriptor.metadata;
  }

  get base(): TypeDescriptor {
    return RecordImpl.base(this.descriptor);
  }

  get draft(): Record {
    return instantiate(this.base);
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
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

  return new RecordImpl({
    type: "Record",
    factory: factory(RecordImpl),
    description: "Record",
    members,
    membersMeta,
    metadata,
    args: null,
    name
  });
}

export interface Record extends Type<RecordDescriptor> {
  readonly name: string;
  readonly draft: Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
}
