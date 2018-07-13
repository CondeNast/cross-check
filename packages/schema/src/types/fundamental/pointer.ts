import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Record } from "../../record";
import { ANY } from "../std/scalars";
import { JSONValue } from "../utils";
import { Alias } from "./alias";
import { PointerDescriptor } from "./descriptor";
import { ReferenceImpl } from "./reference";
import { Type } from "./value";

export class PointerImpl extends ReferenceImpl {
  constructor(readonly descriptor: PointerDescriptor) {
    super(descriptor);
  }

  get base(): Type {
    return new PointerImpl({
      ...this.descriptor,
      args: this.type.required()
    });
  }

  validation(): ValidationBuilder<unknown> {
    return ANY;
  }

  serialize(): undefined {
    return;
  }

  parse(): undefined {
    return;
  }
}

export function hasOne(entity: Record, options: JSONValue = null): Type {
  return new PointerImpl({
    type: "Pointer",
    description: `has one ${entity.descriptor.name || "anonymous"}`,
    args: entity,
    metadata: options,
    name: "hasOne",
    features: []
  }).required(false);
}
