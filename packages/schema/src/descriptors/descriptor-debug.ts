import { Dict, JSONObject, entries } from "ts-std";
import { JSONValue } from "../utils";
import * as unresolved from "./unresolved";

export interface DescriptorJSON {
  type: unresolved.IDescriptor["type"];
  inner?: DescriptorJSON;
  inners?: Dict<DescriptorJSON>;
  attributes?: JSONObject;
}

export function listToJSON(desc: unresolved.List): DescriptorJSON {
  return {
    type: desc.type,
    inner: descToJSON(desc.inner),
    attributes: {
      ...desc.args
    }
  };
}

export function pointerToJSON(desc: unresolved.Pointer): DescriptorJSON {
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

export function iteratorToJSON(desc: unresolved.Iterator): DescriptorJSON {
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

export function dictionaryToJSON(desc: unresolved.Dictionary): DescriptorJSON {
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

export function recordToJSON(desc: unresolved.Record): DescriptorJSON {
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

export function primitiveToJSON(desc: unresolved.Primitive): DescriptorJSON {
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

export function descToJSON(descriptor: unresolved.Descriptor): DescriptorJSON {
  if (unresolved.is(descriptor, "List")) {
    return listToJSON(descriptor);
  } else if (unresolved.is(descriptor, "Pointer")) {
    return pointerToJSON(descriptor);
  } else if (unresolved.is(descriptor, "Iterator")) {
    return iteratorToJSON(descriptor);
  } else if (unresolved.is(descriptor, "Dictionary")) {
    return dictionaryToJSON(descriptor);
  } else if (unresolved.is(descriptor, "Record")) {
    return recordToJSON(descriptor);
  } else if (unresolved.is(descriptor, "Primitive")) {
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

export function formatDescriptor(descriptor: unresolved.Descriptor): string {
  return formatDescriptorJSON(descToJSON(descriptor), 0);
}
