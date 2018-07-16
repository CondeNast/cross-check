import { TypeDescriptor } from "../../fundamental/descriptor";
import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { ReporterDelegate, hasMore } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
  openRequired() {
    /* noop */
  },

  closeRequired() {
    /* noop */
  },

  openAlias({ descriptor }) {
    return descriptor.name;
  },

  closeAlias() {
    /* noop */
  },

  openRecord() {
    return `{\n`;
  },

  closeRecord() {
    return `}`;
  },

  emitKey({ key, nesting, descriptor }): string {
    return `${pad(nesting * 2)}${formattedKey(key, descriptor)}: `;
  },

  closeDictionary({ nesting }): string {
    return `${pad(nesting * 2)}}`;
  },

  closeValue({ position }): string | void {
    if (hasMore(position)) {
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
  }
};

function formattedKey(key: string, descriptor: TypeDescriptor): string {
  if (descriptor.type === "Required" && descriptor.args.required) {
    return key;
  } else {
    return `${key}?`;
  }
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const describe: Formatter = formatter(delegate, Buffer);
