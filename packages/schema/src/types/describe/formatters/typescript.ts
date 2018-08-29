import { Buffer } from "../buffer";
import formatter from "../formatter";
import { ReporterDelegate, isRequiredPosition } from "../reporter";

export interface TypescriptOptions {
  name: string;
}

const delegate: ReporterDelegate<Buffer, string, TypescriptOptions> = {
  openRecord({ options }) {
    return `export interface ${options.name} {\n`;
  },
  closeRecord(): string {
    return `}`;
  },

  openAlias({ descriptor, buffer }): void {
    buffer.push(`${descriptor.name}`);
  },
  closeAlias() {
    /* noop */
  },

  openDictionary(): string {
    return `{\n`;
  },
  closeDictionary({ buffer, nesting }): void {
    buffer.push(`${pad(nesting * 2)}}`);
  },
  emitKey({ key, position, nesting }): string {
    let required = isRequiredPosition(position);
    return `${pad(nesting * 2)}${formattedKey(key, !!required)}: `;
  },
  closeValue(): string {
    return ";\n";
  },

  openGeneric({ descriptor }): string | void {
    switch (descriptor.type) {
      case "Iterator":
      case "List":
        return `Array<`;
      case "Pointer":
      default:
    }
  },

  closeGeneric({ descriptor }): string | void {
    switch (descriptor.type) {
      case "Iterator":
      case "List":
        return `>`;
      case "Pointer":
      default:
    }
  },

  emitPrimitive({ descriptor }): string {
    return `${descriptor.typescript}`;
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

export const typescript = formatter(delegate, Buffer);
