import { Dict, Option, unknown } from "ts-std";
import { Record } from "../../../record";
import {
  AliasDescriptor,
  CollectionDescriptor,
  DictionaryDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor
} from "../../fundamental/descriptor";
import { JSONValue, exhausted } from "../../utils";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

interface Primitive {
  type: string;
  args?: JSONValue;
  required: boolean;
}

interface Generic {
  type: "Pointer" | "List" | "Iterator";
  kind?: string;
  args?: JSONValue;
  of: Item;
  required: boolean;
}

interface GenericReference extends Generic {
  type: "Pointer" | "Iterator";
  kind: string;
  args?: JSONValue;
  of: Item;
  required: boolean;
}

type GenericOptions = Pick<GenericReference, "kind" | "args">;

interface Dictionary {
  type: "Dictionary";
  members: Dict<Item>;
  required: boolean;
}

interface Alias {
  alias: string;
}

type Item = Generic | Primitive | Dictionary | Alias;

class JSONFormatter implements RecursiveDelegate {
  private visitor = RecursiveVisitor.build(this);

  templated() {
    throw new Error("unimplemented");
  }

  primitive({ name, args }: PrimitiveDescriptor, required: boolean): Primitive {
    if (args !== undefined) {
      return { type: name || "anonymous", args, required };
    } else {
      return { type: name || "anonymous", required };
    }
  }

  alias(alias: AliasDescriptor): Alias {
    return {
      alias: alias.name
    };
  }

  generic(
    entity: Item,
    descriptor: CollectionDescriptor,
    required: boolean
  ): Generic {
    let { type } = descriptor;
    let options: Option<{ kind?: string; args?: JSONValue }> = {};

    switch (type) {
      case "Iterator":
        options = referenceOptions(descriptor);
        break;

      case "List":
        break;

      case "Pointer":
        options = referenceOptions(descriptor);
        break;

      default:
        return exhausted(type);
    }

    return {
      type,
      ...options,
      of: entity,
      required
    };
  }

  dictionary(descriptor: DictionaryDescriptor, required: boolean): Dictionary {
    return {
      type: "Dictionary",
      members: this.dictionaryOrRecord(descriptor),
      required
    };
  }

  record(
    descriptor: RecordDescriptor
  ): {
    fields: Dict<Item>;
    metadata: Option<JSONValue>;
  } {
    return {
      fields: this.dictionaryOrRecord(descriptor),
      metadata: descriptor.metadata
    };
  }

  private dictionaryOrRecord(
    descriptor: DictionaryDescriptor | RecordDescriptor
  ): Dict<Item> {
    let members = {} as Dict<Item>;
    this.visitor.processDictionary(descriptor, (item, key) => {
      members[key] = item;
    });
    return members;
  }
}

function referenceOptions(
  descriptor: CollectionDescriptor
): Pick<GenericReference, "kind" | "args"> {
  let options = {} as GenericOptions;

  if (descriptor.type === "Iterator" || descriptor.type === "Pointer") {
    options.kind = descriptor.name;
  }

  if (descriptor.metadata) {
    options.args = descriptor.metadata;
  }

  return options;
}

export function toJSON(record: Record): unknown {
  return new JSONFormatter().record(record.descriptor);
}
