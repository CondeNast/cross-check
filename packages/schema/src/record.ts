import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, Option, dict, entries, expect } from "ts-std";
import { AbstractDictionary } from "./types/fundamental/dictionary";
import { Type } from "./types/fundamental/value";
import { Label, RecordLabel } from "./types/label";

class RecordImpl extends AbstractDictionary implements Record {
  constructor(
    readonly name: string,
    inner: Dict<Type>,
    required: boolean,
    protected readonly meta: Option<Dict>
  ) {
    super(inner, name, required);
  }

  get base(): Record {
    let draftDict = dict<Type>();

    for (let [key, value] of entries(this.inner)) {
      draftDict[key] = value!.base.required(false);
    }

    return new RecordImpl(this.name, draftDict, false, this.meta);
  }

  get draft(): Record {
    return this.base;
  }

  required(isRequired = true): Type {
    return new RecordImpl(this.name, this.inner, isRequired, this.meta);
  }

  named(arg: Option<string>): Type {
    let name = expect(arg, "Don't try to rename a Record to null");

    return new RecordImpl(name, this.inner, this.isRequired, this.meta);
  }

  metadata(meta: Dict): this {
    return new RecordImpl(this.name, this.inner, this.isRequired, meta) as this;
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }

  get label(): Label<RecordLabel> {
    return {
      type: { kind: "record", members: this.inner, metadata: this.meta },
      description: "record",
      name: this.name,
      registeredName: this.name
    };
  }
}

export function Record(name: string, members: Dict<Type>): Record {
  return new RecordImpl(name, members, false, null);
}

export interface Record extends Type {
  readonly name: string;
  readonly label: Label<RecordLabel>;
  readonly draft: Record;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
  metadata(obj: Dict): Record;
}
