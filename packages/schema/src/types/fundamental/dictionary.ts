import { ValidationBuilder, validators } from "@cross-check/dsl";
import { builders, dehydrated } from "../../descriptors";
import { Type } from "../../type";
import { mapDict } from "../../utils";

export interface DictionaryImplOptions {
  strictKeys: boolean;
}

export interface DictionaryType extends Type {
  readonly members: { [key: string]: Type };
}

export class DictionaryImpl implements DictionaryType {
  constructor(
    readonly members: { [key: string]: Type },
    private options: DictionaryImplOptions
  ) {}

  dehydrate(): dehydrated.Dictionary {
    return {
      type: "Dictionary",
      members: mapDict(this.members, member => {
        return {
          descriptor: member.dehydrate()
        };
      }),
      required: "always"
    };
  }

  serialize(js: { [key: string]: unknown }): { [key: string]: unknown } | null {
    if (js === null) {
      return null;
    }

    return mapDict(this.members, (member, key) => {
      if (!(key in js)) {
        throw new Error(`Serialization error: missing field \`${key}\` (must validate before serializing)`);
      }

      let result = member.serialize(js[key]);

      if (result !== null) {
        return result;
      }
    });
  }

  parse(wire: { [key: string]: unknown }): { [key: string]: unknown } | null {
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
  members: { [key: string]: builders.MembersMeta };
  name?: string;
}

export function Dictionary(
  members: { [key: string]: builders.TypeBuilderMember }
): builders.DictionaryBuilder {
  return new builders.DictionaryBuilder({ members });
}
