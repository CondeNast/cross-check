import { Dict, JSONObject, Option, entries, unknown } from "ts-std";
import { JSONValue, exhausted } from "../utils";
import { Type } from "./value";

export interface AbstractTypeDescriptor<Args> {
  readonly type:
    | "Alias"
    | "Required"
    | "Pointer"
    | "Iterator"
    | "List"
    | "Dictionary"
    | "Record"
    | "Primitive";
  readonly metadata: Option<JSONValue>;
  readonly args: Args;

  readonly name: Option<string>;
  readonly description: string;

  readonly features: string[];
}

export function defaults<K extends TypeDescriptor["type"], Options>(
  type: K,
  options: Options
): {
  type: K;
  metadata: null;
  name: null;
  features: never[];
} & Options {
  return Object.assign(
    {
      type,
      metadata: null,
      name: null,
      features: []
    },
    options
  );
}

export interface DescriptorJSON {
  type: TypeDescriptor["type"];
  inner?: DescriptorJSON;
  inners?: Dict<DescriptorJSON>;
  attributes?: JSONObject;
}

export interface AliasDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "Alias";
  readonly metadata: null;
  readonly name: string;
  readonly args: Type;
  readonly features: never[];
}

export function aliasToJSON(desc: AliasDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.args.descriptor),
    attributes: {
      name: desc.name
    }
  };
}

export interface RequiredArgs {
  type: Type;
  required: boolean;
}

export interface RequiredDescriptor
  extends AbstractTypeDescriptor<RequiredArgs> {
  readonly type: "Required";
  readonly metadata: null;
  readonly args: RequiredArgs;
  readonly name: null;
  readonly features: never[];
}

export function requiredToJSON(desc: RequiredDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.args.type.descriptor),
    attributes: {
      required: desc.args.required
    }
  };
}

export interface ListDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "List";
  readonly metadata: { allowEmpty: boolean };
  readonly args: Type;
}

export function listToJSON(desc: ListDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.args.descriptor),
    attributes: {
      metadata: desc.metadata
    }
  };
}

export interface PointerDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "Pointer";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly args: Type;
}

export function pointerToJSON(desc: PointerDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.args.descriptor),
    attributes: {
      name: desc.name,
      metadata: desc.metadata
    }
  };
}

export interface IteratorDescriptor extends AbstractTypeDescriptor<Type> {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: Option<JSONValue>;
  readonly args: Type;
}

export function iteratorToJSON(desc: IteratorDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.args.descriptor),
    attributes: {
      name: desc.name,
      metadata: desc.metadata
    }
  };
}

export interface DictionaryDescriptor
  extends AbstractTypeDescriptor<Dict<Type>> {
  readonly type: "Dictionary";
  readonly metadata: null;
  readonly args: Dict<Type>;
}

export function dictionaryToJSON(desc: DictionaryDescriptor): DescriptorJSON {
  let members: Dict<DescriptorJSON> = {};

  for (let [key, value] of entries(desc.args)) {
    members[key] = descToJSON(value!.descriptor);
  }

  return {
    type: desc.type,
    inners: members
  };
}

export interface RecordDescriptor extends AbstractTypeDescriptor<Dict<Type>> {
  readonly type: "Record";
  readonly name: string;
  readonly metadata: Option<JSONObject>;
  readonly args: Dict<Type>;
}

export function recordToJSON(desc: RecordDescriptor): DescriptorJSON {
  let members: Dict<DescriptorJSON> = {};

  for (let [key, value] of entries(desc.args)) {
    members[key] = descToJSON(value!.descriptor);
  }

  return {
    type: desc.type,
    inners: members,
    attributes: {
      name: desc.name,
      metadata: desc.metadata
    }
  };
}

export interface PrimitiveDescriptor<Args extends JSONValue = JSONValue>
  extends AbstractTypeDescriptor<Args | undefined> {
  readonly type: "Primitive";
  readonly typescript: string;
  readonly metadata: null;
  readonly args: Args | undefined;
}

export function primitiveToJSON(
  desc: PrimitiveDescriptor<JSONValue>
): DescriptorJSON {
  return {
    type: desc.type,
    attributes: {
      name: desc.name,
      typescript: desc.typescript,
      description: desc.description,
      args: desc.args || null
    }
  };
}

export type TypeDescriptor =
  | AliasDescriptor
  | RequiredDescriptor
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor
  | DictionaryDescriptor
  | RecordDescriptor
  | PrimitiveDescriptor;

// args is a Type
export type CollectionDescriptor =
  | ListDescriptor
  | PointerDescriptor
  | IteratorDescriptor;

export function descToJSON(descriptor: TypeDescriptor): DescriptorJSON {
  switch (descriptor.type) {
    case "Alias":
      return aliasToJSON(descriptor);

    case "Required":
      return requiredToJSON(descriptor);

    case "List":
      return listToJSON(descriptor);

    case "Pointer":
      return pointerToJSON(descriptor);

    case "Iterator":
      return iteratorToJSON(descriptor);

    case "Dictionary":
      return dictionaryToJSON(descriptor);

    case "Record":
      return recordToJSON(descriptor);

    case "Primitive":
      return primitiveToJSON(descriptor);

    default:
      return exhausted(descriptor);
  }
}

function formatDescriptorJSON(
  descriptor: DescriptorJSON,
  nesting: number
): string {
  let out = pad(nesting);

  let isBlock = !!(descriptor.inner || descriptor.inners);

  if (isBlock) {
    out += `${descriptor.type}`;
  } else {
    out += `(${descriptor.type}`;
  }

  if (descriptor.attributes) {
    for (let [key, value] of entries(descriptor.attributes)) {
      out += ` ${key}=${formatJSON(value!)}`;
    }
  }

  if (descriptor.inner) {
    out += ` {\n`;
    out += formatDescriptorJSON(descriptor.inner, nesting + 1);
    out += `${pad(nesting)}}`;
  }

  if (descriptor.inners) {
    out += ` {\n`;

    let keys = Object.keys(descriptor.inners);
    let first = true;
    keys.forEach(key => {
      let value = descriptor.inners![key]!;

      if (!first) {
        out += "\n";
      } else {
        first = false;
      }

      out += `${pad(nesting + 1)}${key}: {\n`;
      out += formatDescriptorJSON(value!, nesting + 2);
      out += `${pad(nesting + 1)}}\n`;
    });

    out += `${pad(nesting)}}`;
  }

  if (isBlock) {
    out += "\n";
  } else {
    out += `)\n`;
  }

  return out;
}

function formatJSON(json: JSONValue): string {
  if (json && typeof json === "object") {
    let out = [];

    for (let [key, value] of entries(json)) {
      out.push(`${key}=${formatJSON(value)}`);
    }

    return `(${out.join(" ")})`;
  } else {
    return JSON.stringify(json);
  }
}

function pad(size: number): string {
  return " ".repeat(size * 2);
}

export function formatDescriptor(descriptor: TypeDescriptor): string {
  return formatDescriptorJSON(descToJSON(descriptor), 0);
}
