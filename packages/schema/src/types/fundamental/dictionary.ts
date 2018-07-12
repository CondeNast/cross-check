import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries, unknown } from "ts-std";
import { DictionaryDescriptor, RecordDescriptor } from "./descriptor";
import { AbstractType, Type, parse, serialize, validationFor } from "./value";

function buildRecordValidation(desc: Dict<Type>): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return validators.strictObject(obj);
}

export type AbstractDictionaryDescriptor =
  | DictionaryDescriptor
  | RecordDescriptor;

export abstract class AbstractDictionary<
  Descriptor extends AbstractDictionaryDescriptor
> extends AbstractType<Descriptor> {
  abstract readonly base: Type<Descriptor>;

  protected get types(): Dict<Type> {
    return this.descriptor.args;
  }

  serialize(js: Dict): Option<Dict> {
    return serialize(js, !this.isRequired, () => {
      let out: Dict = {};

      for (let [key, value] of entries(this.types)) {
        assert(
          key in js,
          `Serialization error: missing field \`${key}\` (must validate before serializing)`
        );

        let result = value!.serialize(js[key]);

        if (result !== null) {
          out[key] = result;
        }
      }

      return out;
    });
  }

  parse(wire: Dict): Option<Dict> {
    return parse(wire, !this.isRequired, () => {
      let out: Dict = {};

      for (let [key, value] of entries(this.types)) {
        let raw = wire[key];

        if (raw === undefined) {
          assert(!value!.isRequired, `Parse error: missing field \`${key}\``);
          raw = null;
        }

        out[key] = value!.parse(raw);
      }

      return out;
    });
  }

  validation(): ValidationBuilder<unknown> {
    let validation = buildRecordValidation(this.types);

    return validationFor(validation, this.isRequired);
  }
}

export class DictionaryImpl extends AbstractDictionary<DictionaryDescriptor> {
  get base(): DictionaryImpl {
    let draftDict = dict<Type>();

    for (let [key, value] of entries(this.types)) {
      draftDict[key] = value!.base.required(false);
    }

    return new DictionaryImpl({
      ...this.descriptor,
      args: draftDict
    });
  }
}

export function Dictionary(dictionary: Dict<Type>): DictionaryImpl {
  return new DictionaryImpl({
    type: "Dictionary",
    description: "Dictionary",
    args: dictionary,
    metadata: null,
    name: null,
    required: false,
    features: []
  });
}

export type ConstructDictionary = (d: Dict<Type>) => DictionaryImpl;
