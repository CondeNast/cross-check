import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, assert, dict, entries } from "ts-std";
import { DictionaryLabel, Label, typeNameOf } from "../label";
import { Type, parse, serialize, validationFor } from "./value";

function buildRecordValidation(desc: Dict<Type>): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return validators.strictObject(obj);
}

export interface DictionaryType extends Type {
  label: Label<DictionaryLabel>;
}

export abstract class AbstractDictionary implements Type {
  abstract readonly label: Label;
  abstract readonly base: Type;

  constructor(
    protected inner: Dict<Type>,
    protected typeName: string | undefined,
    readonly isRequired: boolean
  ) {}

  abstract required(isRequired?: boolean): Type;
  abstract named(arg: Option<string>): Type;

  serialize(js: Dict): Option<Dict> {
    return serialize(js, !this.isRequired, () => {
      let out: Dict = {};

      for (let [key, value] of entries(this.inner)) {
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

      for (let [key, value] of entries(this.inner)) {
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
    let validation = buildRecordValidation(this.inner);

    return validationFor(validation, this.isRequired);
  }
}

export class DictionaryImpl extends AbstractDictionary
  implements DictionaryType {
  get label(): Label<DictionaryLabel> {
    return {
      type: { kind: "dictionary", members: this.inner },
      description: "dictionary",
      name: this.typeName,
      registeredName: this.typeName === undefined ? undefined : this.typeName
    };
  }

  get base(): DictionaryImpl {
    let draftDict = dict<Type>();

    for (let [key, value] of entries(this.inner)) {
      draftDict[key] = value!.base.required(false);
    }

    return new DictionaryImpl(draftDict, undefined, false);
  }

  required(isRequired = true): Type {
    return new DictionaryImpl(this.inner, this.typeName, isRequired);
  }

  named(arg: Option<string>): Type {
    let name = `${arg}${typeNameOf(this.typeName)}`;
    return new DictionaryImpl(
      this.inner,
      arg === null ? undefined : name,
      this.isRequired
    );
  }
}

export function Dictionary(d: Dict<Type>): DictionaryType {
  return new DictionaryImpl(d, undefined, false);
}

export type ConstructDictionary = (d: Dict<Type>) => DictionaryType;
