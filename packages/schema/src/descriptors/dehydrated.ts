import { Dict, JSONObject } from "ts-std";
import { Registry, RegistryName } from "../registry";
import { Type } from "../type";
import {
  DictionaryImpl,
  IteratorImpl,
  ListImpl,
  OptionalityImpl,
  PointerImpl,
  visitor
} from "../types";
import { JSONValue, exhausted, mapDict } from "../utils";
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
  readonly inner: Record;
}

//// List ////
export interface List {
  readonly type: "List";
  readonly args?: resolved.ListArgs;
  readonly inner: Descriptor;
}

//// Named ////
export interface Named {
  readonly type: "Named";
  readonly target: RegistryName;
  readonly name: string;
  readonly args?: JSONValue;
}

//// Pointer ////
export interface Pointer {
  readonly type: "Pointer";
  readonly kind: string;
  readonly metadata: JSONObject | null;
  readonly inner: Record;
}

//// Primitive ////
export interface Primitive {
  readonly type: "Primitive";
  readonly name: string;
  readonly args: JSONValue | undefined;
  readonly base?: { name: string; args: JSONValue | undefined };
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
  features?: string[];
  draft?: boolean;
}

export function hydrate(
  descriptor: Dictionary | Record,
  registry: Registry,
  parameters: HydrateParameters,
  required?: boolean
): DictionaryImpl;
export function hydrate(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters,
  required?: boolean
): Type;
export function hydrate(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters,
  isRequired?: boolean
): Type {
  function buildType(): Type {
    switch (descriptor.type) {
      case "Named": {
        let desc = registry.get({
          type: descriptor.target,
          name: descriptor.name
        });

        return hydrate(desc, registry, parameters, isRequired);
      }

      case "Dictionary": {
        return new DictionaryImpl(
          mapDict(descriptor.members, member => {
            let isMemberRequired =
              parameters.draft === true ? false : member.meta.required;

            if (hasFeatures(parameters.features, member.meta.features)) {
              return hydrate(
                member.descriptor,
                registry,
                parameters,
                isMemberRequired
              );
            } else {
              return undefined;
            }
          })
        );
      }

      case "Iterator": {
        let inner = registry.getRecord(descriptor.inner.name, parameters);
        return new IteratorImpl(inner.dictionary);
      }

      case "List": {
        let args = descriptor.args || { allowEmpty: false };

        if (isRequired === false) {
          args = { allowEmpty: true };
        }

        let contents = hydrate(descriptor.inner, registry, parameters);

        return new ListImpl(contents, args);
      }

      case "Pointer": {
        let inner = registry.getRecord(descriptor.inner.name, parameters);
        return new PointerImpl(inner.dictionary);
      }

      case "Primitive": {
        let desc;

        if (parameters.draft && descriptor.base) {
          desc = descriptor.base;
        } else {
          desc = descriptor;
        }

        let { factory, buildArgs } = registry.getPrimitive(desc.name);
        let args;

        if (buildArgs) {
          args = buildArgs(desc.args, isRequired === true);
        } else {
          args = desc.args;
        }

        return factory(args);
      }

      case "Record": {
        return registry.getRecord(descriptor.name, parameters).dictionary;
      }

      default:
        return exhausted(descriptor);
    }
  }

  if (isRequired !== undefined) {
    return required(buildType(), isRequired);
  } else {
    return buildType();
  }
}

function required(type: Type, isRequired: boolean): Type {
  return new OptionalityImpl(type, { isOptional: !isRequired });
}

function hasFeatures(
  featureList: string[] | undefined,
  neededFeatures: string[] | undefined
): boolean {
  if (featureList === undefined || neededFeatures === undefined) {
    return true;
  }

  for (let feature of neededFeatures) {
    if (featureList.indexOf(feature) === -1) {
      return false;
    }
  }

  return true;
}

/***** Visitor Descriptors *****/

export function visitorDescriptor(
  descriptor: Named,
  registry: Registry,
  isRequired?: boolean
): visitor.Alias;
export function visitorDescriptor(
  descriptor: Dictionary,
  registry: Registry,
  isRequired?: boolean
): visitor.Dictionary;
export function visitorDescriptor(
  descriptor: Record,
  registry: Registry,
  isRequired?: boolean
): visitor.Record;
export function visitorDescriptor(
  descriptor: Descriptor,
  registry: Registry,
  isRequired?: boolean
): visitor.Descriptor;
export function visitorDescriptor(
  descriptor: Descriptor,
  registry: Registry,
  isRequired?: boolean
): visitor.Descriptor {
  switch (descriptor.type) {
    case "Named": {
      return {
        type: "Alias",
        target: descriptor.target,
        name: descriptor.name
      };
    }

    case "Dictionary": {
      return {
        type: "Dictionary",
        members: mapDict(descriptor.members, member => {
          return {
            descriptor: visitorDescriptor(
              member.descriptor,
              registry,
              member.meta.required
            ),
            meta: member.meta
          };
        })
      };
    }

    case "Iterator": {
      return {
        type: "Iterator",
        inner: {
          type: "Alias",
          target: "Dictionary",
          name: descriptor.inner.name
        },
        metadata: descriptor.metadata,
        name: descriptor.kind
      };
    }

    case "List": {
      return {
        type: "List",
        inner: visitorDescriptor(descriptor.inner, registry, true),
        args: descriptor.args || { allowEmpty: false }
      };
    }

    case "Pointer": {
      return {
        type: "Pointer",
        inner: {
          type: "Alias",
          target: "Dictionary",
          name: descriptor.inner.name
        },
        metadata: descriptor.metadata,
        name: descriptor.kind
      };
    }

    case "Primitive": {
      let { description, typescript, buildArgs } = registry.getPrimitive(
        descriptor.name
      );

      let { name, args } = descriptor;

      if (buildArgs) {
        args = buildArgs(args, isRequired === true);
      }

      return {
        type: "Primitive",
        name,
        args,
        description,
        typescript
      };
    }

    case "Record": {
      let { dictionary, metadata } = registry.getRawRecord(descriptor.name);
      let members = visitorDescriptor(dictionary, registry, isRequired).members;

      return {
        type: "Record",
        name: descriptor.name,
        members,
        metadata
      };
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
  Primitive: Primitive;
  Record: Record;
}

export type DescriptorType = keyof Descriptors;
export type Descriptor = Descriptors[DescriptorType];
