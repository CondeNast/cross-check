import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
  openRecord() {
    return `{\n`;
  },

  closeRecord() {
    return `}`;
  },

  emitKey({ key, required, nesting }): string {
    return `${pad(nesting * 2)}${formattedKey(key, required)}: `;
  },

  closeDictionary({ nesting }): string {
    return `${pad(nesting * 2)}}`;
  },

  closeValue({ position }): string | void {
    if (position === Position.First || position === Position.Middle) {
      return ",\n";
    } else {
      return "\n";
    }
  },

  openGeneric({ descriptor }) {
    switch (descriptor.type) {
      case "Iterator":
        return "has many ";
      case "Pointer":
        return "has one ";
      case "List":
        return "list of ";
    }
  },

  closeGeneric() {
    /* noop */
  },

  openDictionary(): string {
    return `{\n`;
  },

  emitPrimitive({ descriptor }): string {
    return `<${descriptor.description}>`;
  },

  emitNamedType({ descriptor }): string {
    if (descriptor.type === "Primitive") {
      return `<${descriptor.description}>`;
    } else {
      return `${descriptor.name}`;
    }
  }
};

function formattedKey(key: string, required: boolean): string {
  if (required) {
    return key;
  } else {
    return `${key}?`;
  }
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const describe: Formatter = formatter(delegate, Buffer);
