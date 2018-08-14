import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Type } from "../../type";
import { DictionaryImpl } from "../../types/fundamental";
import { ANY } from "./core";

export abstract class ReferenceImpl implements Type {
  constructor(protected type: DictionaryImpl) {}

  validation(): ValidationBuilder<unknown> {
    return ANY;
  }

  serialize(_input: unknown): unknown {
    return undefined;
  }

  parse(_input: unknown): unknown {
    return undefined;
  }
}
