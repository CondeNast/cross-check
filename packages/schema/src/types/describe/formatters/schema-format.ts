import { PrimitiveDescriptor } from "../../fundamental/descriptor";
import { JSONValue } from "../../utils";
import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
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
  closeDictionary({ buffer, nesting, position, descriptor }): string | void {
    buffer.push(`${pad(nesting * 2)}})`);

    if (
      descriptor.required &&
      position !== Position.ListItem &&
      position !== Position.PointerItem
    ) {
      buffer.push(".required()");
    }
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
  closeGeneric({ buffer, position, descriptor }): void {
    buffer.push(")");

    if (
      descriptor.required &&
      position !== Position.ListItem &&
      position !== Position.PointerItem
    ) {
      buffer.push(".required()");
    }
  },

  emitNamedType({ descriptor, buffer }): void {
    buffer.push(`${descriptor.name}`);
  },

  closeValue({ position }): string | void {
    if (position === Position.First || position === Position.Middle) {
      return ",\n";
    } else if (position === Position.Last) {
      return "\n";
    }
  },

  emitPrimitive({ descriptor, position, buffer }): void {
    buffer.push(formatType(descriptor));

    if (
      descriptor.required &&
      position !== Position.ListItem &&
      position !== Position.IteratorItem
    ) {
      buffer.push(`.required()`);
    }
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
