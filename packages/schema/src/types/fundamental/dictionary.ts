import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries, unknown } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { AbstractType } from "./core";

export class DictionaryImpl<D extends resolved.Dictionary> extends AbstractType<
  D
  > {
  serialize(js: Dict): Option<Dict> {
    if (js === null) {
      return null;
    }

    let out: Dict = {};

    for (let [key, value] of entries(this.descriptor.members)) {
      assert(
        key in js,
        `Serialization error: missing field \`${key}\` (must validate before serializing)`
      );

      let result = resolved.instantiate(value!).serialize(js[key]);

      if (result !== null) {
        out[key] = result;
      }
    }

    return out;
  }

  parse(wire: Dict): Option<Dict> {
    let out: Dict = {};

    for (let [key, value] of entries(this.descriptor.members)) {
      let raw = wire[key];

      if (raw === undefined) {
        raw = null;
      }

      out[key] = resolved.instantiate(value!).parse(raw);
    }

    return out;
  }

  validation(): ValidationBuilder<unknown> {
    let obj = dict<ValidationBuilder<unknown>>();

    for (let [key, value] of entries(this.descriptor.members)) {
      obj[key] = resolved.instantiate(value!).validation();
    }

    return validators.strictObject(obj);
  }
}

export interface DictionaryOptions {
  members: Dict<registered.MembersMeta>;
  name?: string;
}

export function Dictionary(members: Dict<registered.RegisteredType>): registered.Dictionary {
  return new registered.Dictionary({ members });
}
