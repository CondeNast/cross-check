import {
  ObjectModel,
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
import { Registry } from "./registry";
import { Type } from "./type";
import * as visitor from "./types/describe/visitor";
import { mapDict } from "./utils";

export interface RecordState {
  name: string;
}

export interface FormattableRecord {
  name: string;
  members: dehydrated.Dictionary;
  metadata: JSONObject | null;
}

export interface RecordDetails {}

export class RecordBuilder
  implements builders.TypeBuilderMember, FormattableRecord {
  constructor(
    readonly name: string,
    readonly members: dehydrated.Dictionary,
    readonly metadata: JSONObject | null
  ) {}

  get builder(): builders.NamedBuilder {
    return new builders.NamedBuilder({
      target: "Record",
      name: this.name
    });
  }

  dehydrate(): dehydrated.Record {
    return {
      type: "Named",
      target: "Record",
      name: this.name,
      required: "always"
    };
  }

  descriptor(registry: Registry): visitor.Record {
    return {
      type: "Record",
      name: this.name,
      members: mapDict(this.members.members, member => {
        return {
          descriptor: visitorDescriptor(member.descriptor, registry),
          meta: member.meta
        };
      }),
      metadata: this.metadata,
      required:
        this.members.required === "always" ||
        this.members.required === "published"
    };
  }

  with(params: dehydrated.HydrateParameters): RecordImpl {
    let dictionary = dehydrated.hydrate(this.members, params.registry, params);
    return new RecordImpl(dictionary, this.metadata, this.name);
  }
}

export class RecordImpl implements Type, Buildable, FormattableRecord {
  constructor(
    private dictionary: Type,
    readonly metadata: JSONObject | null,
    readonly name: string
  ) {}

  get members(): dehydrated.Dictionary {
    return this.dehydrate();
  }

  dehydrate(): dehydrated.Dictionary {
    return this.dictionary.dehydrate() as dehydrated.Dictionary;
  }

  validate(obj: Dict, objectModel: ObjectModel): Task<ValidationError[]> {
    let validation = this.dictionary.validation();

    return validate(obj, build(validation), null, objectModel);
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
}

export function Record(
  name: string,
  { fields, metadata }: RecordOptions
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

  return new RecordBuilder(name, dictionary, metadata || null);
}

export type Record = RecordBuilder;
