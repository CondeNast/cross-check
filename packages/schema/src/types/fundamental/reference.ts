import { ValidationBuilder } from "@cross-check/dsl";
import { JSONObject } from "ts-std";
import { dehydrated } from "../../index";
import { Type } from "../../type";
import { DictionaryType } from "../../types/fundamental";
import { ANY } from "./core";

export abstract class ReferenceImpl implements Type {
  constructor(
    protected type: DictionaryType,
    readonly name: string,
    readonly kind: string,
    readonly metadata: JSONObject | null
  ) {}

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
