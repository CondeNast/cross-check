import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries, unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { METADATA, TypeBuilder } from "../../type";
import { mapDict } from "../../utils";
import { AbstractType, Optionality, TypeBuilderImpl } from "./core";

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
): Dict<builder.Member> {
  return mapDict(dictionary, value => {
    return {
      descriptor: value.descriptor,
      meta: {
        features: value[METADATA].features || undefined,
        required: value[METADATA].required || false
      }
    };
  });
}

export function ResolvedDictionary(
  members: Dict<resolved.Descriptor>
): resolved.Dictionary {
  return {
    type: "Dictionary",
    members,
    instantiate: desc => new DictionaryImpl(desc)
  };
}

export function ResolvedMembers(
  members: Dict<builder.Member>
): Dict<resolved.Descriptor> {
  return mapDict(members, member => {
    let { required } = member.meta;

    let inner = builder.resolve(member.descriptor, required !== false);
    inner = Optionality(inner, required === false);

    return inner;
  });
}

export interface DictionaryOptions {
  members: Dict<builder.Member>;
  name?: string;
}

export function DictionaryBuilder({
  members,
  name
}: DictionaryOptions): builder.Dictionary {
  return {
    type: "Dictionary",
    members,
    metadata: null,
    name: name || null,
    instantiate: (d: builder.Dictionary) =>
      ResolvedDictionary(ResolvedMembers(d.members))
  };
}

export function Dictionary(dictionary: Dict<TypeBuilder>): TypeBuilder {
  let members = buildMembers(dictionary);

  return new TypeBuilderImpl(DictionaryBuilder({ members }));
}
