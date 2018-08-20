import { Dict, JSONObject } from "ts-std";
import { Registry, RegistryName } from "../registry";
import { Type } from "../type";
import {
  DictionaryImpl,
  IteratorImpl,
  ListArgs,
  ListImpl,
  OptionalityImpl,
  PointerImpl,
  visitor
} from "../types";
import { JSONValue, exhausted, mapDict } from "../utils";

export type Args = JSONValue | undefined;

export type Required = "always" | "never" | "published";

/***** Concrete Descriptors *****/

//// Dictionary ////
export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  readonly features?: string[];
}

export interface Member {
  readonly descriptor: Descriptor;
  readonly meta?: MembersMeta;
}

export interface Dictionary {
  readonly type: "Dictionary";
  readonly members: Dict<Member>;
  readonly required: Required;
}

//// Iterator ////
export interface Iterator {
  readonly type: "Iterator";
  readonly kind: string;
  readonly metadata: JSONObject | null;
  readonly inner: string;
  readonly required: Required;
}

//// List ////
export interface List {
  readonly type: "List";
  readonly args?: ListArgs;
  readonly inner: Descriptor;
  readonly required: Required;
}

//// Named ////
export interface Named {
  readonly type: "Named";
  readonly target: RegistryName;
  readonly name: string;
  readonly args?: JSONValue;
  readonly required: Required;
}

//// Pointer ////
export interface Pointer {
  readonly type: "Pointer";
  readonly kind: string;
  readonly metadata: JSONObject | null;
  readonly inner: string;
  readonly required: Required;
}

//// Primitive ////
export interface Primitive {
  readonly type: "Primitive";
  readonly name: string;
  readonly args: JSONValue | undefined;
  readonly base?: { name: string; args: JSONValue | undefined };
  readonly required: Required;
}

//// Record ////
export interface Record {
  readonly type: "Record";
  readonly name: string;
  readonly required: Required;
}

/***** Hydrator *****/

export interface HydrateParameters {
  features?: string[];
  draft?: boolean;
  strictKeys?: boolean;
}

export function hydrate(
  descriptor: Dictionary | Record,
  registry: Registry,
  parameters: HydrateParameters,
  forceIsRequired?: boolean
): DictionaryImpl;
export function hydrate(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters,
  forceIsRequired?: boolean
): Type;
export function hydrate(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters,
  forceIsRequired?: boolean
): Type {
  let computedRequired: boolean;

  if (forceIsRequired !== undefined) {
    computedRequired = forceIsRequired;
  } else {
    computedRequired = isRequired(
      descriptor.required,
      parameters.draft === true
    );
  }

  return required(
    buildType(descriptor, registry, parameters, computedRequired),
    computedRequired
  );
}

function buildType(
  descriptor: Descriptor,
  registry: Registry,
  parameters: HydrateParameters,
  computedRequired: boolean
): Type {
  switch (descriptor.type) {
    case "Named": {
      let desc = registry.get({
        type: descriptor.target,
        name: descriptor.name
      });

      return hydrate(desc, registry, parameters);
    }

    case "Dictionary": {
      return new DictionaryImpl(
        mapDict(descriptor.members, member => {
          if (
            hasFeatures(
              parameters.features,
              member.meta && member.meta.features
            )
          ) {
            return hydrate(member.descriptor, registry, parameters);
          } else {
            return undefined;
          }
        }),
        { strictKeys: parameters.strictKeys !== false }
      );
    }

    case "Iterator": {
      let inner = registry.getRecord(descriptor.inner, parameters);
      return new IteratorImpl(
        inner.dictionary,
        inner.name,
        descriptor.kind,
        descriptor.metadata
      );
    }

    case "List": {
      let args = descriptor.args || { allowEmpty: false };

      if (!computedRequired) {
        args = { allowEmpty: true };
      }

      let contents = hydrate(descriptor.inner, registry, parameters, true);

      return new ListImpl(contents, args);
    }

    case "Pointer": {
      let inner = registry.getRecord(descriptor.inner, parameters);
      return new PointerImpl(
        inner.dictionary,
        inner.name,
        descriptor.kind,
        descriptor.metadata
      );
    }

    case "Primitive": {
      let primitive;

      if (parameters.draft && descriptor.base) {
        primitive = descriptor.base;
      } else {
        primitive = descriptor;
      }

      let { factory, buildArgs } = registry.getPrimitive(primitive.name);
      let args;

      if (buildArgs) {
        args = buildArgs(primitive.args, computedRequired);
      } else {
        args = primitive.args;
      }

      return factory(args);
    }

    case "Record": {
      let dictionary = registry.getRawRecord(descriptor.name).dictionary;
      return hydrate(dictionary, registry, parameters);
    }

    default:
      return exhausted(descriptor);
  }
}

function required(type: Type, computedRequired: boolean): Type {
  return new OptionalityImpl(type, { isOptional: !computedRequired });
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
  registry: Registry
): visitor.Alias;
export function visitorDescriptor(
  descriptor: Dictionary,
  registry: Registry
): visitor.Dictionary;
export function visitorDescriptor(
  descriptor: Record,
  registry: Registry
): visitor.Record;
export function visitorDescriptor(
  descriptor: Record | Dictionary,
  registry: Registry
): visitor.Record | visitor.Dictionary;
export function visitorDescriptor(
  descriptor: Descriptor,
  registry: Registry
): visitor.Descriptor;
export function visitorDescriptor(
  descriptor: Descriptor,
  registry: Registry
): visitor.Descriptor {
  switch (descriptor.type) {
    case "Named": {
      return {
        type: "Alias",
        target: descriptor.target,
        name: descriptor.name,
        required: visitorRequired(descriptor.required)
      };
    }

    case "Dictionary": {
      return {
        type: "Dictionary",
        members: mapDict(descriptor.members, member => {
          return {
            descriptor: visitorDescriptor(member.descriptor, registry),
            meta: member.meta
          };
        }),
        required: visitorRequired(descriptor.required)
      };
    }

    case "Iterator": {
      return {
        type: "Iterator",
        inner: {
          type: "Alias",
          target: "Dictionary",
          name: descriptor.inner,
          required: true
        },
        metadata: descriptor.metadata,
        name: descriptor.kind,
        required: visitorRequired(descriptor.required)
      };
    }

    case "List": {
      return {
        type: "List",
        inner: visitorDescriptor(descriptor.inner, registry),
        args: descriptor.args || { allowEmpty: false },
        required: visitorRequired(descriptor.required)
      };
    }

    case "Pointer": {
      return {
        type: "Pointer",
        inner: {
          type: "Alias",
          target: "Dictionary",
          name: descriptor.inner,
          required: true
        },
        metadata: descriptor.metadata,
        name: descriptor.kind,
        required: visitorRequired(descriptor.required)
      };
    }

    case "Primitive": {
      let { description, typescript, buildArgs } = registry.getPrimitive(
        descriptor.name
      );

      let { name, args } = descriptor;

      if (buildArgs) {
        args = buildArgs(args, visitorRequired(descriptor.required));
      }

      return {
        type: "Primitive",
        name,
        args,
        description,
        typescript,
        required: visitorRequired(descriptor.required)
      };
    }

    case "Record": {
      let { dictionary, metadata } = registry.getRawRecord(descriptor.name);
      let members = visitorDescriptor(dictionary, registry).members;

      return {
        type: "Record",
        name: descriptor.name,
        members,
        metadata,
        required: visitorRequired(descriptor.required)
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

/***** Helper Functions *****/

function isRequired(requiredWhen: Required, draft: boolean): boolean {
  if (draft === true) {
    return requiredWhen === "always";
  } else {
    return requiredWhen === "always" || requiredWhen === "published";
  }
}

function visitorRequired(requiredWhen: Required): boolean {
  return requiredWhen === "always" || requiredWhen === "published";
}
