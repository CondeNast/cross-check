import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries, unknown } from "ts-std";
import {
  DictionaryDescriptor,
  MembersMeta,
  RecordDescriptor,
  TypeDescriptor,
  factory
} from "../../descriptors";
import {
  AbstractType,
  TypeBuilder,
  base,
  buildMeta,
  buildType,
  instantiate,
  required
} from "./core";

export type AbstractDictionaryDescriptor =
  | DictionaryDescriptor
  | RecordDescriptor;

export class DictionaryImpl<
  Descriptor extends AbstractDictionaryDescriptor
> extends AbstractType<Descriptor> {
  static base(
    descriptor: DictionaryDescriptor | RecordDescriptor
  ): TypeDescriptor {
    let draftDict = dict<TypeDescriptor>();

    for (let [key, value] of entries(descriptor.members)) {
      draftDict[key] = required(base(value!), false);
    }

    return {
      ...descriptor,
      members: draftDict
    };
  }

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

      let result = instantiate(value!).serialize(js[key]);

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

      out[key] = instantiate(value!).parse(raw);
    }

    return out;
  }

  validation(): ValidationBuilder<unknown> {
    let obj = dict<ValidationBuilder<unknown>>();

    for (let [key, value] of entries(this.descriptor.members)) {
      obj[key] = instantiate(value!).validation();
    }

    return validators.strictObject(obj);
  }
}

export function buildMembers(
  dictionary: Dict<TypeBuilder>
): {
  members: Dict<TypeDescriptor>;
  membersMeta: Dict<MembersMeta>;
} {
  let membersDict = dict<TypeDescriptor>();
  let membersMeta = dict<MembersMeta>();

  for (let [key, value] of entries(dictionary)) {
    membersDict[key] = buildType(value!.descriptor, { position: "Dictionary" });
    membersMeta[key] = buildMeta(value!, { position: "Dictionary" });
  }

  return { members: membersDict, membersMeta };
}

export function Dictionary(dictionary: Dict<TypeBuilder>): TypeBuilder {
  let { members, membersMeta } = buildMembers(dictionary);

  return new TypeBuilder({
    type: "Dictionary",
    factory: factory(DictionaryImpl),
    description: "Dictionary",
    members,
    membersMeta,
    args: null,
    metadata: null
  });
}
