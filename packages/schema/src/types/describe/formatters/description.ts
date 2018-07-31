import { unresolved } from "../../../descriptors";
import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { ReporterDelegate, isLast, isRequiredPosition } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
  openAlias({ descriptor }) {
    return descriptor.name;
  },

  closeAlias() {
    return;
  },

  openRecord() {
    return `{\n`;
  },

  closeRecord() {
    return `}`;
  },

  emitKey({ key, nesting, position }): string {
    let formattedKey = isRequiredPosition(position) ? key : `${key}?`;

    return `${pad(nesting * 2)}${formattedKey}: `;
  },

  closeDictionary({ nesting }): string {
    return `${pad(nesting * 2)}}`;
  },

  closeValue({ position }): string | void {
    if (isLast(position)) {
      return "\n";
    } else {
      return ",\n";
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

function pad(size: number): string {
  return " ".repeat(size);
}

export const describe: Formatter = formatter(delegate, Buffer);
