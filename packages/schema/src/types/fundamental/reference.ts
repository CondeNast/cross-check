import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Type } from "../../type";
import { ANY } from "./core";

export abstract class ReferenceImpl implements Type {
  constructor(protected type: Type) {}

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
