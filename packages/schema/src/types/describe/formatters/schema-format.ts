import { PrimitiveDescriptor } from "../../../descriptors";
import { JSONValue } from "../../../utils";
import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import {
  ReporterDelegate,
  inIterator,
  inList,
  inPointer,
  isLast
} from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
  openAlias({ descriptor }) {
    return descriptor.name;
  },

  closeAlias() {
    /* noop */
  },

  openRequired() {
    /* noop */
  },

  closeRequired({ descriptor, position }) {
    if (
      descriptor.args.required &&
      !inList(position) &&
      !inIterator(position) &&
      !inPointer(position)
    ) {
      return `.required()`;
    } else {
      return;
    }
  },

  openRecord({ descriptor }) {
    let name = descriptor.name;
    return `Record(${JSON.stringify(name)}, {\n`;
  },

  closeRecord({ buffer, descriptor, nesting }) {
    buffer.push("})");

    const metadata = descriptor.metadata;

    if (metadata) {
      buffer.push(".metadata({\n");

      let keys = Object.keys(metadata);
      let last = keys.length - 1;

      keys.forEach((key, i) => {
        buffer.push(
          `${pad(nesting * 2)}${key}: ${JSON.stringify(metadata[key])}`
        );

        if (i !== last) {
          buffer.push(",");
        }

        buffer.push("\n");
      });

      buffer.push("})");
    }
  },

  openDictionary(): string {
    return `Dictionary({\n`;
  },
  emitKey({ key, nesting }): string {
    return `${pad(nesting * 2)}${key}: `;
  },
  closeDictionary({ buffer, nesting }): string | void {
    buffer.push(`${pad(nesting * 2)}})`);
  },

  openGeneric({ buffer, descriptor }): void {
    switch (descriptor.type) {
      case "Iterator":
        buffer.push("hasMany(");
        break;
      case "List":
        buffer.push("List(");
        break;
      case "Pointer":
        buffer.push("hasOne(");
        break;
      default:
        throw new Error("unreachable");
    }
  },
  closeGeneric({ buffer }): void {
    buffer.push(")");
  },

  closeValue({ position }): string | void {
    if (isLast(position)) {
      return "\n";
    } else {
      return ",\n";
    }
  },

  emitPrimitive({ descriptor, buffer }): void {
    buffer.push(formatType(descriptor));
  }
};

function formatType(descriptor: PrimitiveDescriptor) {
  let out = `${descriptor.name || "anonymous"}(${formatArgs(descriptor.args)})`;

  return out;
}

function formatArgs(args: JSONValue | undefined): string {
  if (Array.isArray(args)) {
    return JSON.stringify(args).slice(1, -1);
  } else if (args === undefined) {
    return "";
  } else {
    return JSON.stringify(args);
  }
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const schemaFormat: Formatter<void> = formatter(delegate, Buffer);
