import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, dict, entries } from "ts-std";
import { DictionaryDescriptor } from "./types/fundamental/descriptor";
import { AbstractDictionary } from "./types/fundamental/dictionary";
import { Type } from "./types/fundamental/value";
import { Label, RecordLabel } from "./types/label";
import { JSONValue } from "./types/utils";

class RecordImpl extends AbstractDictionary implements Record {
  constructor(readonly descriptor: DictionaryDescriptor & { name: string }) {
    super(descriptor);
  }

  get name(): string {
    return this.descriptor.name;
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

  metadata(metadata: JSONObject): Record {
    return new RecordImpl({
      ...this.descriptor,
      metadata
    });
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }

  get label(): Label<RecordLabel> {
    return {
      type: {
        kind: "record",
        members: this.types,
        metadata: this.descriptor.metadata
      },
      description: "record",
      name: this.name,
      registeredName: this.name
    };
  }
}

export function Record(name: string, members: Dict<Type>): Record {
  return new RecordImpl({
    type: "Dictionary",
    args: members,
    metadata: null,
    name,
    required: false,
    features: []
  });
}

export interface Record extends Type {
  readonly name: string;
  readonly label: Label<RecordLabel>;
  readonly draft: Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
  metadata(obj: JSONValue): Record;
}
