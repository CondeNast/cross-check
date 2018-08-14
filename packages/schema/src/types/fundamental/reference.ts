import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { dehydrated } from "../../index";
import { Type } from "../../type";
import { DictionaryImpl } from "../../types/fundamental";
import { ANY } from "./core";

export abstract class ReferenceImpl implements Type {
  constructor(protected type: DictionaryImpl) {}

  abstract dehydrate(): dehydrated.Iterator | dehydrated.Pointer;

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
