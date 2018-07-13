import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, Option, dict, entries } from "ts-std";
import { RecordDescriptor } from "./types/fundamental/descriptor";
import { AbstractDictionary } from "./types/fundamental/dictionary";
import { Type } from "./types/fundamental/value";

class RecordImpl extends AbstractDictionary<RecordDescriptor>
  implements Record {
  constructor(readonly descriptor: RecordDescriptor) {
    super(descriptor);
  }

  get name(): string {
    return this.descriptor.name;
  }

  get fields(): Dict<Type> {
    return this.descriptor.args;
  }

  get metadata(): Option<JSONObject> {
    return this.descriptor.metadata;
  }

  get base(): Record {
    let draftDict = dict<Type>();

    for (let [key, value] of entries(this.types)) {
      draftDict[key] = value!.base.required(false);
    }

    return new RecordImpl({
      ...this.descriptor,
      args: draftDict
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
    description: "Record",
    args: options.fields,
    metadata: options.metadata || null,
    name,
    features: []
  });
}

export interface Record extends Type<RecordDescriptor> {
  readonly name: string;
  readonly draft: Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
}
