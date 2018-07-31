import { Dict, Option, dict, unknown } from "ts-std";
import { unresolved } from "../../../descriptors";
import { Record } from "../../../record";
import { JSONValue, exhausted } from "../../../utils";
import {
  Pos,
  isExplicitRequiredPosition,
  isRequiredPosition
} from "../reporter";
import {
  RecursiveDelegate,
  RecursiveDelegateTypes,
  RecursiveVisitor
} from "../visitor";

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
  base?: true;
  required: boolean;
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

  primitive(desc: unresolved.Primitive, pos: Pos): Primitive {
    let required = isRequiredPosition(pos);
    let args = unresolved.buildArgs(desc, isRequiredPosition(pos));

    if (args !== undefined) {
      return { type: desc.name || "anonymous", args, required };
    } else {
      return { type: desc.name || "anonymous", required };
    }
  }

  alias(alias: unresolved.Alias, pos: Pos): Alias {
    let output: Alias = {
      alias: alias.name,
      required: isRequiredPosition(pos)
    };

    return output;
  }

  generic(
    entity: Item,
    descriptor: unresolved.Iterator | unresolved.List | unresolved.Pointer,
    pos: Pos
  ): Generic {
    let { type } = descriptor;
    let options: Option<{ kind?: string; args?: JSONValue }> = {};

    switch (type) {
      case "Iterator":
        options = genericOptions(descriptor, pos);
        break;

      case "List":
        options = genericOptions(descriptor, pos);
        break;

      case "Pointer":
        options = genericOptions(descriptor, pos);
        break;

      default:
        return exhausted(type);
    }

    return {
      type,
      ...options,
      of: entity,
      required: isRequiredPosition(pos)
    };
  }

  dictionary(descriptor: unresolved.Dictionary, pos: Pos): Dictionary {
    return {
      type: "Dictionary",
      members: this.dictionaryOrRecord(descriptor),
      required: isRequiredPosition(pos)
    };
  }

  record(
    descriptor: unresolved.Record
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
    descriptor: unresolved.Dictionary | unresolved.Record
  ): Dict<Item> {
    let members = dict<Item>();
    this.visitor.processDictionary(descriptor, (item, key, pos) => {
      if (isExplicitRequiredPosition(pos)) {
        item.required = true;
      } else if (isRequiredPosition(pos) === false) {
        item.required = false;
      }

      members[key] = item;
    });
    return members;
  }
}

function genericOptions(
  descriptor: unresolved.Iterator | unresolved.Pointer | unresolved.List,
  pos: Pos
): Pick<GenericReference, "kind" | "args"> {
  let options = {} as GenericOptions;

  if (descriptor.type === "Iterator" || descriptor.type === "Pointer") {
    options.kind = descriptor.name;
  } else if (descriptor.type === "List" && isRequiredPosition(pos) === false) {
    options.args = { allowEmpty: true };
  }

  if (descriptor.metadata) {
    options.args = descriptor.metadata;
  }

  return options;
}

function isRequired(pos: Pos, position: "Dictionary"): Option<boolean> {
  if (isExplicitRequiredPosition(pos)) {
    return true;
  } else if (isRequiredPosition(pos) === false) {
    return false;
  } else {
    return null;
  }
}

export function toJSON(record: Record): unknown {
  return new JSONFormatter().record(record.descriptor);
}
