import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option, dict, entries } from "ts-std";
import { RecordDescriptor, TypeDescriptor, factory } from "./descriptors";
import {
  AbstractDictionary,
  Type,
  TypeBuilder,
  base,
  buildType,
  instantiate,
  required
} from "./types/fundamental";

export interface View {
  draft: boolean;
  features: string[];
}

class RecordImpl extends AbstractDictionary<RecordDescriptor>
  implements Record {
  static base(descriptor: RecordDescriptor): RecordDescriptor {
    let draftDict = dict<TypeDescriptor>();

    for (let [key, value] of entries(descriptor.members)) {
      draftDict[key] = required(base(value!), false);
    }

    return {
      ...descriptor,
      members: draftDict
    };
  }

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

  get base(): RecordDescriptor {
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

export function Record(name: string, options: RecordOptions): Record {
  let members = dict<TypeDescriptor>();

  for (let [key, value] of entries(options.fields)) {
    members[key] = buildType(value!.descriptor, { position: "Dictionary" });
  }

  return new RecordImpl({
    type: "Record",
    factory: factory(RecordImpl),
    description: "Record",
    members,
    metadata: options.metadata || null,
    isBase: false,
    args: null,
    name
  });
}

export interface Record extends Type<RecordDescriptor> {
  readonly name: string;
  readonly draft: Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
}
