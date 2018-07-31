import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries, unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { AbstractType, TypeBuilder } from "./core";

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

export function buildMembers(
  dictionary: Dict<TypeBuilder>
): {
  members: Dict<builder.Descriptor>;
  membersMeta: Dict<builder.MembersMeta>;
} {
  let membersDict = dict<builder.Descriptor>();
  let membersMeta = dict<builder.MembersMeta>();

  for (let [key, value] of entries(dictionary)) {
    membersDict[key] = value!.descriptor;
    membersMeta[key] = {
      features: value!.builderMetadata.features || undefined,
      required: value!.builderMetadata.required || false
    };
  }

  return { members: membersDict, membersMeta };
}

export function Dictionary(dictionary: Dict<TypeBuilder>): TypeBuilder {
  let { members, membersMeta } = buildMembers(dictionary);

  return new TypeBuilder(
    builder.Dictionary(members, membersMeta, DictionaryImpl)
  );
}
