import { Dict } from "ts-std";
import { TypeBuilder } from "../../type";
import { mapDict } from "../../utils";
import { Dictionary } from "../fundamental";

export function RequiredFields(properties: Dict<TypeBuilder>): TypeBuilder {
  return Dictionary(required(properties));
}

export function required(properties: Dict<TypeBuilder>): Dict<TypeBuilder> {
  return mapDict(properties, builder => builder.required());
}
