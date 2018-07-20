import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option, dict, entries } from "ts-std";
import { RecordDescriptor } from "./types/fundamental/descriptor";
import { AbstractDictionary } from "./types/fundamental/dictionary";
import { Type, TypeBuilder } from "./types/fundamental/value";

export interface View {
  draft: boolean;
  features: string[];
}

class RecordImpl extends AbstractDictionary<RecordDescriptor>
  implements Record {
  constructor(readonly descriptor: RecordDescriptor) {
    super(descriptor);
  }

  get name(): string {
    return this.descriptor.name;
  }

  get fields(): Dict<Type> {
    return this.descriptor.members;
  }

  get metadata(): Option<JSONObject> {
    return this.descriptor.metadata;
  }

  get base(): Record {
    let draftDict = dict<TypeBuilder>();

    for (let [key, value] of entries(this.types)) {
      draftDict[key] = value!.base.required(false);
    }

    return new RecordImpl({
      ...this.descriptor,
      isBase: true,
      members: draftDict
    });
  }

  get draft(): Record {
    return this.base;
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }
}

export interface RecordOptions {
  fields: Dict<Type>;
  metadata?: JSONObject;
}

export function Record(name: string, options: RecordOptions): Record {
  return new RecordImpl({
    type: "Record",
    factory: (desc: RecordDescriptor) => new RecordImpl(desc),
    description: "Record",
    members: options.fields,
    metadata: options.metadata || null,
    isBase: false,
    args: null,
    name
  });
}

export interface Record extends TypeBuilder {
  readonly name: string;
  readonly draft: Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
}
