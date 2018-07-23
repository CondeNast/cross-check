import { Dict, dict, entries } from "ts-std";
import { Dictionary, TypeBuilder } from "../fundamental";

export function RequiredFields(properties: Dict<TypeBuilder>): TypeBuilder {
  return Dictionary(required(properties));
}

export function required(properties: Dict<TypeBuilder>): Dict<TypeBuilder> {
  let out = dict<TypeBuilder>();

  for (let [key, value] of entries(properties)) {
    out[key] = value!.required();
  }

  return out;
}
