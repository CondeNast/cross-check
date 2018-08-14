import { Dict, Option } from "ts-std";
import { RecordBuilder } from "../../../record";
import { titleize } from "../../../utils";
import formatter from "../formatter";
import { Accumulator, ReporterDelegate, isRequiredPosition } from "../reporter";

class TypeBuffer {
  private buf: string;

  constructor(public name: string) {
    this.buf = `type ${name} {\n`;
  }

  push(s: string): void {
    this.buf += s;
  }

  done(): string {
    return this.buf;
  }
}

class BufferStack implements Accumulator<string> {
  types: TypeBuffer[] = [];
  finished: TypeBuffer[] = [];
  key: Option<string> = null;
  template: Option<string> = null;

  get currentName(): string {
    return this.types[this.types.length - 1].name;
  }

  pushType(name: string): void {
    this.types.push(new TypeBuffer(name));
  }

  push(s: string): void {
    this.types[this.types.length - 1].push(s);
  }

  pushKey(key: string): void {
    this.key = key;
    this.push(`  ${key}: `);
  }

  doneValue(required: boolean): void {
    let suffix = required ? "!" : "";
    this.push(`${suffix}\n`);
  }

  pushTemplate(typeName: string): void {
    this.template = typeName;
    this.pushType(typeName);
    this.key = null;
  }

  pushSubType(): void {
    if (this.template) return;
    let typeName = `${this.currentName}${titleize(this.key!)}`;
    this.push(typeName);
    this.pushType(typeName);
    this.key = null;
  }

  doneType(): void {
    this.push("}");
    let type = this.types.pop();
    this.finished.push(type!);
    this.template = null;
  }

  done(): string {
    let finished = this.finished.map(f => f.done()).join("\n\n");
    if (this.types.length) {
      finished += `\n\n${this.types.map(t => t.done()).join("\n\n")}`;
    }
    return finished;
  }
}

const delegate: ReporterDelegate<BufferStack, string, GraphqlOptions> = {
  openAlias({ buffer, descriptor }) {
    buffer.push(descriptor.name);
  },

  closeAlias() {
    /* TODnoopO */
  },

  openRecord({ options, buffer }): void {
    buffer.pushType(options.name);
  },

  closeRecord({ buffer }): void {
    buffer.doneType();
  },

  emitKey({ key, buffer }): void {
    buffer.pushKey(key);
  },

  openDictionary({ buffer }): void {
    buffer.pushSubType();
  },

  closeDictionary({ buffer }): void {
    buffer.doneType();
  },

  closeValue({ buffer, position }): void {
    buffer.doneValue(!!isRequiredPosition(position));
  },

  openGeneric({ buffer, descriptor }): void {
    switch (descriptor.type) {
      case "Iterator":
      case "List":
        buffer.push("[");
        break;
      case "Pointer":
      default:
    }
  },
  closeGeneric({ buffer, descriptor }): void {
    switch (descriptor.type) {
      case "Iterator":
      case "List":
        buffer.push("!]");
        break;
      case "Pointer":
      default:
    }
  },

  emitPrimitive({ descriptor, buffer, options }): void {
    if (descriptor.name !== null) {
      buffer.push(`${options.scalarMap[descriptor.name]}`);
    } else {
      throw new Error(
        `Primitive types must be registered in the scalar map. Found an anonymous primitive with description \`${
          descriptor.description
        }\`.`
      );
    }
  }
};

export interface GraphqlOptions {
  name: string;
  scalarMap: Dict;
}

export const graphql: ((
  record: RecordBuilder,
  options: GraphqlOptions
) => string) = formatter(delegate, BufferStack);
