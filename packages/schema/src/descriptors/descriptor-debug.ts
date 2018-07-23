import { Dict, JSONObject, entries } from "ts-std";
import { JSONValue } from "../utils";
import {
  AliasDescriptor,
  DictionaryDescriptor,
  IteratorDescriptor,
  ListDescriptor,
  PointerDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  RequiredArgs,
  RequiredDescriptor,
  TypeDescriptor,
  isDescriptor
} from "./descriptor";

export interface DescriptorJSON {
  type: TypeDescriptor["type"];
  inner?: DescriptorJSON;
  inners?: Dict<DescriptorJSON>;
  attributes?: JSONObject;
}

export function aliasToJSON(desc: AliasDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      name: desc.name
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

export function listToJSON(desc: ListDescriptor): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      ...desc.args
    }
  };
}

export function pointerToJSON(desc: PointerDescriptor): DescriptorJSON {
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

export function iteratorToJSON(desc: IteratorDescriptor): DescriptorJSON {
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

export function dictionaryToJSON(desc: DictionaryDescriptor): DescriptorJSON {
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

export function recordToJSON(desc: RecordDescriptor): DescriptorJSON {
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

export function primitiveToJSON(desc: PrimitiveDescriptor): DescriptorJSON {
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
  if (isDescriptor(descriptor, "Alias")) {
    return aliasToJSON(descriptor);
  } else if (isDescriptor(descriptor, "Required")) {
    return requiredToJSON(descriptor);
  } else if (isDescriptor(descriptor, "List")) {
    return listToJSON(descriptor);
  } else if (isDescriptor(descriptor, "Pointer")) {
    return pointerToJSON(descriptor);
  } else if (isDescriptor(descriptor, "Iterator")) {
    return iteratorToJSON(descriptor);
  } else if (isDescriptor(descriptor, "Dictionary")) {
    return dictionaryToJSON(descriptor);
  } else if (isDescriptor(descriptor, "Record")) {
    return recordToJSON(descriptor);
  } else if (isDescriptor(descriptor, "Primitive")) {
    return primitiveToJSON(descriptor);
  } else {
    throw new Error("unreachable");
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
