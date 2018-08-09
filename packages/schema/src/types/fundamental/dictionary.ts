import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, unknown } from "ts-std";
import { registered } from "../../descriptors";
import { Type } from "../../type";
import { mapDict } from "../../utils";

export class DictionaryImpl implements Type {
  constructor(private members: Dict<Type>) {}

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
    return validators.strictObject(
      mapDict(this.members, member => member.validation())
    );
  }
}

export interface DictionaryOptions {
  members: Dict<registered.MembersMeta>;
  name?: string;
}

export function Dictionary(
  members: Dict<registered.RegisteredType>
): registered.Dictionary {
  return new registered.Dictionary({ members });
}
