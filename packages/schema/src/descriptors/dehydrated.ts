import { Dict, JSONObject } from "ts-std";
import { Registry, RegistryName } from "../registry";
import { Type } from "../type";
import { JSONValue, exhausted, mapDict } from "../utils";
import * as registered from "./registered";
import * as resolved from "./resolved";

export type Args = JSONValue | undefined;

export interface Factory<D extends Descriptor> {
  new (descriptor: D): resolved.Descriptor;
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
}

//// Iterator ////
export interface Iterator {
  readonly type: "Iterator";
  readonly kind: string;
  readonly metadata: JSONObject | null;
  readonly inner: Named;
}

//// List ////
export interface List {
  readonly type: "List";
  readonly args: resolved.ListArgs;
  readonly inner: Descriptor;
}

//// Named ////
export interface Named {
  readonly type: "Named";
  readonly target: RegistryName;
  readonly name: string;
  readonly args?: JSONValue;
}

//// Optionality ////
export interface Optionality {
  readonly type: "Optionality";
  readonly inner: Descriptor;
  readonly required: boolean;
}

//// Pointer ////
export interface Pointer {
  readonly type: "Pointer";
  readonly kind: string;
  readonly metadata: JSONObject | null;
  readonly inner: Named;
}

//// Primitive ////
export interface Primitive {
  readonly type: "Primitive";
  readonly name: string;
  readonly args: JSONValue | undefined;
}

//// Record ////
export interface Record {
  readonly type: "Record";
  readonly name: string;
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

export function hydrate(
  descriptor: Named,
  registry: Registry,
  parameters: HydrateParameters
): registered.Named;
export function hydrate(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters
): registered.RegisteredType;
export function hydrate(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters
): registered.RegisteredType {
  switch (descriptor.type) {
    case "Named": {
      return new registered.Named({
        target: descriptor.target,
        name: descriptor.name,
        args: descriptor.args
      });
    }

    case "Dictionary": {
      return new registered.Dictionary({
        members: mapDict(descriptor.members, member =>
          hydrate(member.descriptor, registry, parameters)
        )
      });
    }

    case "Iterator": {
      return new registered.Iterator({
        kind: descriptor.kind,
        metadata: descriptor.metadata,
        contents: hydrate(descriptor.inner, registry, parameters)
      });
    }

    case "List": {
      return new registered.List({
        args: descriptor.args,
        contents: hydrate(descriptor.inner, registry, parameters)
      });
    }

    case "Optionality": {
      let inner = hydrate(descriptor.inner, registry, parameters);

      if (descriptor.required === true) {
        inner = inner.required();
      }

      return inner;
    }

    case "Pointer": {
      return new registered.Pointer({
        kind: descriptor.kind,
        metadata: descriptor.metadata,
        contents: hydrate(descriptor.inner, registry, parameters)
      });
    }

    case "Primitive": {
      return new registered.Primitive({
        name: descriptor.name,
        args: descriptor.args
      });
    }

    case "Record": {
      return registry.getRecord(descriptor.name);
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
  Optionality: Optionality;
  Pointer: Pointer;
  Primitive: Primitive;
  Record: Record;
}

export type DescriptorType = keyof Descriptors;
export type Descriptor = Descriptors[DescriptorType];
