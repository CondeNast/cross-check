import { Environment, ValidationError } from "@cross-check/core";
import { Task } from "no-show";
import { Dict, JSONObject, unknown } from "ts-std";
import { dehydrated, registered } from "./descriptors";
import { hydrate, visitorDescriptor } from "./descriptors/dehydrated";
import { finalizeMeta } from "./descriptors/registered";
import { REGISTRY, Registry } from "./registry";
import * as visitor from "./types/describe/visitor";
import { mapDict } from "./utils";

export interface RecordState {
  name: string;
}

/**
 * Note: This class, at the moment, serves as both a Record Builder (duh)
 * as well as a runtime representation of the hydrated Record. This is
 * largely for historical reasons -- in earlier versions of Crosscheck,
 * builders and types were conflated. It should be possible to remove the
 * conflation through a breaking change, if such a breaking change is
 * possible and appropriate.
 */
export class RecordBuilder {
  constructor(
    readonly serialized: dehydrated.Record,
    readonly registry: Registry
  ) {}

  dehydrate(): dehydrated.Record {
    return {
      type: "Record",
      name: this.serialized.name
    };
  }

  get descriptor(): visitor.Record {
    return visitorDescriptor(this.serialized, this.registry);
  }

  get draft(): registered.Record {
    return this.with({ draft: true });
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return this.with().validate(obj, env);
  }

  parse(obj: Dict): unknown {
    return this.with().parse(obj);
  }

  serialize(obj: Dict): unknown {
    return this.with().serialize(obj);
  }

  withFeatures(features: string[]): registered.Record {
    return this.with({ features });
  }

  with(params: dehydrated.HydrateParameters = {}): registered.Record {
    return hydrate(this.serialized, this.registry, params);
  }
}

export interface RecordOptions {
  fields: Dict<registered.TypeBuilder>;
  metadata?: JSONObject;
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
        descriptor: member.dehydrate(),
        meta: finalizeMeta(member)
      };
    })
  };

  registry.setRecord(name, dictionary, metadata);
  return new RecordBuilder({ type: "Record", name }, registry);
}

export type Record = RecordBuilder;
