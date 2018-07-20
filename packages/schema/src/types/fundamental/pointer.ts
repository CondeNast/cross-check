import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Record } from "../../record";
import { ANY } from "../std/scalars";
import { JSONValue } from "../utils";
import { PointerDescriptor } from "./descriptor";
import { ReferenceImpl } from "./reference";
import { TypeBuilder } from "./value";

export class PointerImpl extends ReferenceImpl {
  constructor(readonly descriptor: PointerDescriptor) {
    super(descriptor);
  }

  get base(): TypeBuilder {
    return new PointerImpl({
      ...this.descriptor,
      inner: this.type.base.required(false)
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

export function hasOne(entity: Record, options: JSONValue = null): TypeBuilder {
  return new PointerImpl({
    type: "Pointer",
    factory: (descriptor: PointerDescriptor) => new PointerImpl(descriptor),
    description: `has one ${entity.descriptor.name || "anonymous"}`,
    inner: entity,
    args: options,
    metadata: null,
    name: "hasOne"
  });
}
