import { ValidationBuilder } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { Label, ReferenceLabel } from "../label";
import { ANY } from "../std/scalars";
import { Type } from "./value";

export abstract class ReferenceImpl implements Type {
  abstract readonly label: Label<ReferenceLabel>;
  abstract readonly base: Type;

  constructor(readonly isRequired: boolean) {}

  abstract named(arg: Option<string>): Type;
  abstract required(isRequired?: boolean): Type;

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
