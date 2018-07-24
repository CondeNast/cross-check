import { Dict, JSON, Option } from "ts-std";
import { Record } from "../../../record";
import {
  DictionaryLabel,
  GenericLabel,
  Label,
  NamedLabel,
  PrimitiveLabel,
  RecordLabel,
  typeNameOf
} from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

interface Primitive {
  type: string;
  args?: JSON;
  required: boolean;
}

interface Generic {
  type: "Pointer" | "List" | "Iterator";
  kind?: string;
  args?: JSON;
  of: Item;
  required: boolean;
}

interface GenericReference extends Generic {
  type: "Pointer" | "Iterator";
  kind: string;
  args?: JSON;
  of: Item;
  required: boolean;
}

type GenericOptions = Pick<GenericReference, "kind" | "args">;

interface Dictionary {
  type: "Dictionary";
  members: Dict<Item>;
  required: boolean;
}

type Item = Generic | Primitive | Dictionary;

class JSONFormatter implements RecursiveDelegate {
  private visitor = RecursiveVisitor.build(this);

  templated() {
    throw new Error("unimplemented");
  }

  primitive(
    { name, args }: Label<PrimitiveLabel>,
    required: boolean
  ): Primitive {
    if (args !== undefined) {
      return { type: typeNameOf(name), args, required };
    } else {
      return { type: typeNameOf(name), required };
    }
  }

  named(label: NamedLabel, required: boolean): unknown {
    return {
      type: label.type.kind,
      name: label.name,
      required
    };
  }

  generic<L extends GenericLabel>(
    entity: Item,
    label: Label<L>,
    required: boolean
  ): Generic {
    let type: "Pointer" | "List" | "Iterator";
    let options: Option<{ kind?: string; args?: JSON }> = {};
    let kind = label.type.kind;

    if (kind === "iterator") {
      type = "Iterator";
      options = referenceOptions(label);
    } else if (kind === "list") {
      type = "List";
    } else if (kind === "pointer") {
      type = "Pointer";
      options = referenceOptions(label);
    } else {
      throw new Error("unreachable");
    }

    return {
      type: type!,
      ...options,
      of: entity,
      required
    };
  }

  dictionary(label: DictionaryLabel, required: boolean): Dictionary {
    return {
      type: "Dictionary",
      members: this.dictionaryOrRecord(label),
      required
    };
  }

  record(
    label: RecordLabel
  ): {
    fields: Dict<Item>;
    metadata: Option<Dict>;
  } {
    return {
      fields: this.dictionaryOrRecord(label),
      metadata: label.metadata
    };
  }

  private dictionaryOrRecord(label: DictionaryLabel | RecordLabel): Dict<Item> {
    let members = {} as Dict<Item>;
    this.visitor.processDictionary(label, (item, key) => {
      members[key] = item;
    });
    return members;
  }
}

function referenceOptions(
  label: Label<GenericLabel>
): Pick<GenericReference, "kind" | "args"> {
  let options = {
    kind: label.name
  } as GenericOptions;

  if (label.args) {
    options.args = label.args;
  }

  return options;
}

export function toJSON(record: Record): unknown {
  return new JSONFormatter().record(record.label.type);
}
