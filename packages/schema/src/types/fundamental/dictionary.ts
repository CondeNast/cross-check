import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries, unknown } from "ts-std";
import {
  DictionaryDescriptor,
  RecordDescriptor,
  TypeDescriptor,
  factory
} from "../../descriptors";
import {
  AbstractType,
  TypeBuilder,
  base,
  buildType,
  instantiate,
  required
} from "./core";

export type AbstractDictionaryDescriptor =
  | DictionaryDescriptor
  | RecordDescriptor;

export abstract class AbstractDictionary<
  Descriptor extends AbstractDictionaryDescriptor
> extends AbstractType<Descriptor> {
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

export class DictionaryImpl extends AbstractDictionary<DictionaryDescriptor> {
  static base(descriptor: DictionaryDescriptor): TypeDescriptor {
    let draftDict = dict<TypeDescriptor>();

    for (let [key, value] of entries(descriptor.members)) {
      draftDict[key] = required(base(value!), false);
    }

    return {
      ...descriptor,
      members: draftDict
    };
  }
}

export function Dictionary(dictionary: Dict<TypeBuilder>): TypeBuilder {
  let members = dict<TypeDescriptor>();

  for (let [key, value] of entries(dictionary)) {
    members[key] = buildType(value!.descriptor, { position: "Dictionary" });
  }

  return new TypeBuilder({
    type: "Dictionary",
    factory: factory(DictionaryImpl),
    description: "Dictionary",
    members,
    args: null,
    metadata: null
  });
}

export type ConstructDictionary = (d: Dict<TypeBuilder>) => DictionaryImpl;
