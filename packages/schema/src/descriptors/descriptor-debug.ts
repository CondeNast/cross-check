import { Dict, JSONObject, entries } from "ts-std";
import { JSONValue, exhausted } from "../utils";
import {
  AliasDescriptor,
  DictionaryDescriptor,
  IteratorDescriptor,
  ListArgs,
  ListDescriptor,
  PointerDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  RequiredArgs,
  RequiredDescriptor,
  TypeDescriptor
} from "./descriptor";

export interface DescriptorJSON {
  type: TypeDescriptor["type"];
  inner?: DescriptorJSON;
  inners?: Dict<DescriptorJSON>;
  attributes?: JSONObject;
}

export function aliasToJSON(desc: AliasDescriptor<JSONValue>): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      name: desc.name,
      args: formatJSON(desc.args)
    }
  };
}

export function requiredToJSON(
  desc: RequiredDescriptor<RequiredArgs>
): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      ...desc.args
    }
  };
}

export function listToJSON(desc: ListDescriptor<ListArgs>): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      ...desc.args
    }
  };
}

export function pointerToJSON(
  desc: PointerDescriptor<JSONValue>
): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      name: desc.name,
      args: formatJSON(desc.args),
      metadata: formatJSON(desc.metadata)
    }
  };
}

export function iteratorToJSON(
  desc: IteratorDescriptor<JSONValue>
): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      name: desc.name,
      args: formatJSON(desc.args),
      metadata: formatJSON(desc.metadata)
    }
  };
}

export function dictionaryToJSON(
  desc: DictionaryDescriptor<JSONValue>
): DescriptorJSON {
  let members: Dict<DescriptorJSON> = {};

  for (let [key, value] of entries(desc.members)) {
    members[key] = descToJSON(value!);
  }

  return {
    type: desc.type,
    inners: members,
    attributes: {
      args: formatJSON(desc.args),
      metadata: formatJSON(desc.metadata)
    }
  };
}

export function recordToJSON(
  desc: RecordDescriptor<JSONValue>
): DescriptorJSON {
  let members: Dict<DescriptorJSON> = {};

  for (let [key, value] of entries(desc.members)) {
    members[key] = descToJSON(value!);
  }

  return {
    type: desc.type,
    inners: members,
    attributes: {
      name: desc.name,
      args: formatJSON(desc.args),
      metadata: formatJSON(desc.metadata)
    }
  };
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
