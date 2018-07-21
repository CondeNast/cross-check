import { Dict, Option, dict, unknown } from "ts-std";
import { Record } from "../../../record";
import {
  AliasDescriptor,
  CollectionDescriptor,
  DictionaryDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  RequiredDescriptor
} from "../../fundamental/descriptor";
import { JSONValue, exhausted } from "../../utils";
import {
  RecursiveDelegate,
  RecursiveDelegateTypes,
  RecursiveVisitor
} from "../visitor";

interface Primitive {
  type: string;
  args?: JSONValue;
  required: Option<boolean>;
}

interface Generic {
  type: "Pointer" | "List" | "Iterator";
  kind?: string;
  args?: JSONValue;
  of: Item;
  required: Option<boolean>;
}

interface GenericReference extends Generic {
  type: "Pointer" | "Iterator";
  kind: string;
  args?: JSONValue;
  of: Item;
  required: Option<boolean>;
}

type GenericOptions = Pick<GenericReference, "kind" | "args">;

interface Dictionary {
  type: "Dictionary";
  members: Dict<Item>;
  required: Option<boolean>;
}

interface Alias {
  alias: string;
  base?: true;
  required: Option<boolean>;
}

type Item = Generic | Primitive | Dictionary | Alias;

interface JSONTypes extends RecursiveDelegateTypes {
  primitive: Primitive;
  generic: Generic;
  dictionary: Dictionary;
  alias: Alias;
  required: Item;
}

class JSONFormatter implements RecursiveDelegate<JSONTypes> {
  private visitor = RecursiveVisitor.build<JSONTypes>(this);

  required(inner: Item, required: RequiredDescriptor): Item {
    inner.required = required.args.required;
    return inner;
  }

  primitive({ name, args }: PrimitiveDescriptor): Primitive {
    if (args !== undefined) {
      return { type: name || "anonymous", args, required: null };
    } else {
      return { type: name || "anonymous", required: null };
    }
  }

  alias(alias: AliasDescriptor): Alias {
    let output: Alias = {
      alias: alias.name,
      required: null
    };

    return output;
  }

  generic(entity: Item, descriptor: CollectionDescriptor): Generic {
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
      required: null
    };
  }

  dictionary(descriptor: DictionaryDescriptor): Dictionary {
    return {
      type: "Dictionary",
      members: this.dictionaryOrRecord(descriptor),
      required: null
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
    let members = dict<Item>();
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
