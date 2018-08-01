import { Dict, JSONObject, Option, dict } from "ts-std";
import { builder } from "../../../descriptors";
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

export interface JSONPrimitive {
  type: string;
  args?: JSONValue;
  required: boolean;
}

export interface JSONGeneric {
  type: "Pointer" | "List" | "Iterator";
  kind?: string;
  args?: JSONValue;
  of: Item;
  required: boolean;
}

interface GenericReference extends JSONGeneric {
  type: "Pointer" | "Iterator";
  kind: string;
  args?: JSONObject;
  of: Item;
  required: boolean;
}

type GenericOptions = Pick<GenericReference, "kind" | "args">;

export interface JSONDictionary {
  type: "Dictionary";
  members: Dict<Item>;
  required: boolean;
}

export interface JSONAlias {
  alias: string;
  base?: true;
  required: boolean;
}

export interface JSONRecord {
  fields: Dict<Item>;
  metadata: Option<JSONValue>;
}

export type Item = JSONGeneric | JSONPrimitive | JSONDictionary | JSONAlias;

interface JSONTypes extends RecursiveDelegateTypes {
  primitive: JSONPrimitive;
  generic: JSONGeneric;
  dictionary: JSONDictionary;
  alias: JSONAlias;
  required: Item;
}

class JSONFormatter implements RecursiveDelegate<JSONTypes> {
  private visitor = RecursiveVisitor.build<JSONTypes>(this);

  primitive(desc: builder.Primitive, pos: Pos): JSONPrimitive {
    let required = isRequiredPosition(pos);
    let args = builder.buildArgs(desc, isRequiredPosition(pos));

    if (args !== undefined) {
      return { type: desc.name || "anonymous", args, required };
    } else {
      return { type: desc.name || "anonymous", required };
    }
  }

  alias(alias: builder.Alias, pos: Pos): JSONAlias {
    let output: JSONAlias = {
      alias: alias.name,
      required: isRequiredPosition(pos)
    };

    return output;
  }

  generic(
    entity: Item,
    descriptor: builder.Iterator | builder.List | builder.Pointer,
    pos: Pos
  ): JSONGeneric {
    let { type } = descriptor;
    let options: Option<{ kind?: string; args?: JSONObject }> = {};

    switch (type) {
      case "Iterator":
        options = genericOptions(descriptor, pos);
        break;

      case "List": {
        options = genericOptions(descriptor, pos);

        if (isRequiredPosition(pos) === false) {
          options.args = { ...options.args, allowEmpty: true };
        }

        break;
      }

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

  dictionary(descriptor: builder.Dictionary, pos: Pos): JSONDictionary {
    return {
      type: "Dictionary",
      members: this.dictionaryOrRecord(descriptor),
      required: isRequiredPosition(pos)
    };
  }

  record(
    descriptor: builder.Record
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
    descriptor: builder.Dictionary | builder.Record
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
  descriptor: builder.Iterator | builder.Pointer | builder.List,
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

export function toJSON(record: Record): JSONRecord {
  return new JSONFormatter().record(record.descriptor);
}
