import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert } from "ts-std";
import { builders, dehydrated } from "../../descriptors";
import { Type } from "../../type";
import { mapDict } from "../../utils";

export interface DictionaryImplOptions {
  strictKeys: boolean;
}

export class DictionaryImpl implements Type {
  constructor(
    private members: Dict<Type>,
    private options: DictionaryImplOptions
  ) {}

  dehydrate(): dehydrated.Dictionary {
    return {
      type: "Dictionary",
      members: mapDict(this.members, member => {
        return { descriptor: member.dehydrate() };
      }),
      required: true
    };
  }

  serialize(js: Dict): Option<Dict> {
    if (js === null) {
      return null;
    }

    return mapDict(this.members, (member, key) => {
      assert(
        key in js,
        `Serialization error: missing field \`${key}\` (must validate before serializing)`
      );

      let result = member.serialize(js[key]);

      if (result !== null) {
        return result;
      }
    });
  }

  parse(wire: Dict): Option<Dict> {
    return mapDict(this.members, (member, key) => {
      let raw = wire[key];

      if (raw === undefined) {
        raw = null;
      }

      return member.parse(raw);
    });
  }

  validation(): ValidationBuilder<unknown> {
    if (this.options.strictKeys) {
      return validators.strictObject(
        mapDict(this.members, member => member.validation())
      );
    } else {
      return validators.object(
        mapDict(this.members, member => member.validation())
      );
    }
  }
}

export interface DictionaryOptions {
  members: Dict<builders.MembersMeta>;
  name?: string;
}

export function Dictionary(
  members: Dict<builders.TypeBuilder>
): builders.DictionaryBuilder {
  return new builders.DictionaryBuilder({ members });
}
