import { Dict, JSONObject, Option, dict } from "ts-std";
import { JSONValue, exhausted } from "../../../utils";
import {
  Pos,
  isExplicitRequiredPosition,
  isRequiredPosition
} from "../reporter";
import * as visitor from "../visitor";

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
  metadata?: Option<JSONValue>;
}

export type Item = JSONGeneric | JSONPrimitive | JSONDictionary | JSONAlias;

interface JSONTypes extends visitor.RecursiveDelegateTypes {
  primitive: JSONPrimitive;
  generic: JSONGeneric;
  dictionary: JSONDictionary;
  alias: JSONAlias;
  required: Item;
  record: JSONRecord;
}

class JSONFormatter implements visitor.RecursiveDelegate<JSONTypes> {
  private visitor = visitor.RecursiveVisitor.build<JSONTypes>(this);

  primitive(desc: visitor.Primitive, pos: Pos): JSONPrimitive {
    let required = isRequiredPosition(pos);
    let args = desc.args;

    if (args !== undefined) {
      return { type: desc.name || "anonymous", args, required };
    } else {
      return { type: desc.name || "anonymous", required };
    }
  }

  alias(alias: visitor.Alias, pos: Pos): JSONAlias {
    let output: JSONAlias = {
      alias: alias.name,
      required: isRequiredPosition(pos)
    };

    return output;
  }

  generic(
    entity: Item,
    descriptor: visitor.Iterator | visitor.List | visitor.Pointer,
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

  dictionary(descriptor: visitor.Dictionary, pos: Pos): JSONDictionary {
    return {
      type: "Dictionary",
      members: this.dictionaryOrRecord(descriptor),
      required: isRequiredPosition(pos)
    };
  }

  record(
    descriptor: visitor.Record | visitor.Dictionary
  ): {
    fields: Dict<Item>;
    metadata?: Option<JSONValue>;
  } {
    return {
      fields: this.dictionaryOrRecord(descriptor),
      metadata: "metadata" in descriptor ? descriptor.metadata : undefined
    };
  }

  private dictionaryOrRecord(
    descriptor: visitor.Dictionary | visitor.Record
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
  descriptor: visitor.Iterator | visitor.Pointer | visitor.List,
  pos: Pos
): Pick<GenericReference, "kind" | "args"> {
  let options = {} as GenericOptions;

  if (descriptor.type === "Iterator" || descriptor.type === "Pointer") {
    options.kind = descriptor.name;
  } else if (descriptor.type === "List" && isRequiredPosition(pos) === false) {
    options.args = { allowEmpty: true };
  }

  return options;
}

export const toJSON = visitor.recursive<JSONTypes>(JSONFormatter);
