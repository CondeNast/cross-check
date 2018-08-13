import { Dict, JSONObject, entries } from "ts-std";
import { Record } from "../record";
import * as visitor from "../types/describe/visitor";
import { JSONValue, mapDict } from "../utils";

export interface DescriptorJSON {
  type: keyof visitor.Descriptors;
  inner?: DescriptorJSON;
  inners?: Dict<DescriptorJSON>;
  attributes?: JSONObject;
}

export type Callback<P extends keyof visitor.Descriptors> = (
  desc: visitor.Descriptors[P]
) => DescriptorJSON;

export type ToJSONCallbacks = {
  [P in keyof visitor.Descriptors]: (
    desc: visitor.Descriptors[P]
  ) => DescriptorJSON
};

export const DescToJSON: ToJSONCallbacks = {
  Alias(desc) {
    return {
      type: desc.type,
      name: desc.name
    };
  },

  List(desc) {
    return {
      type: desc.type,
      inner: descToJSON(desc.inner),
      attributes: {
        ...desc.args
      }
    };
  },

  Pointer(desc) {
    return {
      type: desc.type,
      inner: descToJSON(desc.inner),
      attributes: {
        name: desc.name
      }
    };
  },

  Iterator(desc) {
    return {
      type: desc.type,
      inner: descToJSON(desc.inner),
      attributes: {
        name: desc.inner.name,
        metadata: formatJSON(desc.metadata)
      }
    };
  },

  Dictionary(desc) {
    let members = mapDict(desc.members, member =>
      descToJSON(member.descriptor)
    );

    return {
      type: desc.type,
      inners: members
    };
  },

  Record(desc) {
    let members = mapDict(desc.members, member =>
      descToJSON(member.descriptor)
    );

    return {
      type: desc.type,
      inners: members,
      attributes: {
        name: desc.name,
        metadata: formatJSON(desc.metadata)
      }
    };
  },

  Primitive(desc) {
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
};

export function descToJSON<K extends keyof visitor.Descriptors>(
  desc: visitor.Descriptors[K]
): DescriptorJSON {
  let callback = DescToJSON[desc.type] as Callback<K>;

  return callback(desc);
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

function formatJSON(args: JSONValue | undefined): string {
  if (args && typeof args === "object") {
    let out = [];

    for (let [key, value] of entries(args)) {
      out.push(`${key}=${formatJSON(value)}`);
    }

    return `(${out.join(" ")})`;
  } else {
    return JSON.stringify(args);
  }
}

function pad(size: number): string {
  return " ".repeat(size * 2);
}

export function formatDescriptor(type: Record): string {
  return formatDescriptorJSON(descToJSON(type.descriptor), 0);
}
