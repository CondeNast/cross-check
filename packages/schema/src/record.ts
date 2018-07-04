import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, Option, dict, entries, expect } from "ts-std";
import { AbstractDictionary } from "./types/fundamental/dictionary";
import { Type, baseType } from "./types/fundamental/value";
import { Label, RecordLabel } from "./types/label";

class BaseRecordImpl extends AbstractDictionary implements BaseRecord {
  constructor(
    readonly name: string,
    inner: Dict<Type>,
    required: boolean,
    protected readonly meta: Option<Dict>
  ) {
    super(inner, name, required, null);
  }

  required(isRequired = true): Type {
    return new BaseRecordImpl(this.name, this.inner, isRequired, this.meta);
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }

  named(arg: Option<string>): Type {
    let name = expect(arg, "Don't try to rename a Record to null");

    return new BaseRecordImpl(name, this.inner, this.isRequired, this.meta);
  }

  get label(): Label<RecordLabel> {
    return {
      type: { kind: "record", members: this.inner, metadata: this.meta },
      description: "record",
      name: this.name,
      registeredName: this.name
    };
  }

  metadata(meta: Dict): this {
    return new BaseRecordImpl(
      this.name,
      this.inner,
      this.isRequired,
      meta
    ) as this;
  }
}

class RecordImpl extends BaseRecordImpl implements Record {
  base: BaseRecordImpl;

  constructor(
    name: string,
    inner: Dict<Type>,
    required: boolean,
    base: BaseRecordImpl,
    protected readonly meta: Option<Dict>
  ) {
    super(name, inner, required, meta);
    this.base = base;
  }

  get draft(): BaseRecord {
    return this.base!;
  }

  required(isRequired = true): Type {
    return new RecordImpl(
      this.name,
      this.inner,
      isRequired,
      this.base,
      this.meta
    );
  }

  named(arg: Option<string>): Type {
    return new RecordImpl(
      expect(arg, "Don't try to rename a Record to null"),
      this.inner,
      this.isRequired,
      this.base,
      this.meta
    );
  }

  metadata(meta: Dict): this {
    return new RecordImpl(
      this.name,
      this.inner,
      this.isRequired,
      this.base.metadata(meta),
      meta
    ) as this;
  }
}

export function Record(name: string, members: Dict<Type>): Record {
  let strictDict = dict<Type>();
  let draftDict = dict<Type>();

  for (let [key, value] of entries(members)) {
    strictDict[key] = value!;
    draftDict[key] = baseType(value!).required(false);
  }

  let draft = new BaseRecordImpl(name, draftDict, false, null);
  return new RecordImpl(name, strictDict, false, draft, null);
}

export interface BaseRecord extends Type {
  readonly name: string;
  readonly label: Label<RecordLabel>;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
  metadata(obj: Dict): BaseRecord;
}

export interface Record extends BaseRecord {
  readonly name: string;
  readonly draft: BaseRecord;
  metadata(obj: Dict): Record;
}
