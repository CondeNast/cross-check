import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  validate
} from "@cross-check/core";
import build, { BUILD, Buildable, ValidationBuilder } from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject } from "ts-std";
import { builders, dehydrated } from "./descriptors";
import { finalizeMeta } from "./descriptors/builders";
import { visitorDescriptor } from "./descriptors/dehydrated";
import { REGISTRY, Registry } from "./registry";
import { Type } from "./type";
import * as visitor from "./types/describe/visitor";
import { DictionaryImpl } from "./types/fundamental";
import { mapDict } from "./utils";

export interface RecordState {
  name: string;
}

export interface FormattableRecord {
  name: string;
  members: dehydrated.Dictionary;
  metadata: JSONObject | null;
}

export class RecordBuilder
  implements builders.TypeBuilderMember, FormattableRecord {
  constructor(
    readonly serialized: dehydrated.Record,
    readonly registry: Registry
  ) {}

  get name(): string {
    return this.serialized.name;
  }

  get members(): dehydrated.Dictionary {
    let { dictionary } = this.registry.getRawRecord(this.serialized.name);
    return dictionary;
  }

  get metadata(): JSONObject | null {
    return this.registry.getRawRecord(this.serialized.name).metadata;
  }

  get builder(): builders.NamedBuilder {
    return new builders.NamedBuilder({
      target: "Record",
      name: this.serialized.name
    });
  }

  dehydrate(): dehydrated.Record {
    return this.serialized;
  }

  get descriptor(): visitor.Record {
    let { dictionary, metadata } = this.registry.getRawRecord(
      this.serialized.name
    );

    return {
      type: "Record",
      name: this.serialized.name,
      members: mapDict(dictionary.members, member => {
        return {
          descriptor: visitorDescriptor(member.descriptor, this.registry),
          meta: member.meta
        };
      }),
      metadata,
      required:
        this.serialized.required === "always" ||
        this.serialized.required === "published"
    };
  }

  with(params: dehydrated.HydrateParameters = {}): RecordImpl {
    let { dictionary, metadata } = this.registry.getRecord(
      this.serialized.name,
      params
    );

    return new RecordImpl(dictionary, metadata, this.serialized.name);
  }
}

export class RecordImpl implements Type, Buildable, FormattableRecord {
  constructor(
    private dictionary: DictionaryImpl,
    readonly metadata: JSONObject | null,
    readonly name: string
  ) {}

  get members(): dehydrated.Dictionary {
    return this.dictionary.dehydrate();
  }

  dehydrate(): dehydrated.Dictionary {
    return this.dictionary.dehydrate();
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    let validation = this.dictionary.validation();

    return validate(obj, build(validation), null, env);
  }

  validation(): ValidationBuilder<unknown> {
    return this.dictionary.validation();
  }

  parse(value: Dict): unknown {
    return this.dictionary.parse(value);
  }

  serialize(value: Dict): unknown {
    return this.dictionary.serialize(value);
  }

  [BUILD](): ValidationDescriptor {
    return build(this.dictionary.validation());
  }
}

export interface RecordOptions {
  fields: Dict<builders.TypeBuilder>;
  metadata?: JSONObject | null;
  registry?: Registry;
}

export function Record(
  name: string,
  { fields, metadata = null, registry = REGISTRY }: RecordOptions
): RecordBuilder {
  let dictionary: dehydrated.Dictionary = {
    type: "Dictionary",
    members: mapDict(fields, member => {
      return {
        descriptor: member.dehydrate("never"),
        meta: finalizeMeta(member.meta)
      };
    }),
    required: "always"
  };

  registry.setRecord(name, dictionary, metadata);
  return new RecordBuilder(
    { type: "Named", target: "Record", name, required: "always" },
    registry
  );
}

export type Record = RecordBuilder;
