import { Dict, JSONObject, Option } from "ts-std";
import { Type } from "../type";
import { JSONValue, exhausted, mapDict } from "../utils";
import * as builder from "./builder";
import * as resolved from "./resolved";

export type Args = JSONValue | undefined;

export interface Factory<D extends Descriptor> {
  new(descriptor: D): resolved.Descriptor;
}

/***** Concrete Descriptors *****/

//// Dictionary ////
export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
  required: boolean;
}

export interface Member {
  descriptor: Descriptor;
  meta: MembersMeta;
}

export interface Dictionary {
  readonly type: "Dictionary";
  readonly members: Dict<Member>;
  readonly metadata: JSONObject | null;
}

//// Iterator ////
export interface Iterator {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: JSONObject | null;
  readonly inner: Named;
}

//// List ////
export interface ListArgs extends JSONObject {
  readonly allowEmpty: boolean;
}

export interface List {
  readonly type: "List";
  readonly args: ListArgs;
  readonly inner: Descriptor;
}

//// Named ////
export interface Named {
  readonly type: "Named";
  readonly target: resolved.DescriptorType;
  readonly name: string;
  readonly args?: JSONValue;
}

//// Pointer ////
export interface Pointer {
  readonly type: "Pointer";
  readonly kind: string;
  readonly metadata: JSONObject | null;
  readonly inner: Named;
}

/***** Hydrator *****/

export interface ResolveDelegate {
  descriptor(id: Named): resolved.Descriptor;
  instantiate(desc: Descriptor): Type;
}

export interface HydrateParameters {
  features: string[];
  draft: boolean;
}

export function hydrate(descriptor: Descriptor, resolver: ResolveDelegate, parameters: HydrateParameters): resolved.Descriptor {
  switch (descriptor.type) {
    case "Named": {
      return resolver.descriptor(descriptor);
    }

    case "Dictionary": {
      return {
        type: "Dictionary",
        members: mapDict(descriptor.members, member =>
          hydrate(member.descriptor, resolver, parameters)
        )
      };
    }

    case "Iterator": {
      return {
        type: "Iterator",
        inner: hydrate(descriptor.inner, resolver, parameters)
      }
    }

    case "List": {
      return {
        type: "List",
        inner: hydrate(descriptor.inner, resolver, parameters),
        args: descriptor.args
      }
    }

    case "Pointer": {
      return {
        type: "Pointer",
        inner: hydrate(descriptor.inner, resolver, parameters)
      }
    }

    default:
      return exhausted(descriptor);
  }
}

/***** Descriptor Type Map *****/
export interface Descriptors {
  Dictionary: Dictionary;
  Iterator: Iterator;
  List: List;
  Named: Named;
  Pointer: Pointer;
}

export type DescriptorType = keyof Descriptors;
export type Descriptor = Descriptors[DescriptorType];
