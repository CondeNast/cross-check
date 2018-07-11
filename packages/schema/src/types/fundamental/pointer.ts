import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, PointerLabel, typeNameOf } from "../label";
import { ANY } from "../std/scalars";
import { JSONValue } from "../utils";
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

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        of: this.type.required()
      },
      name: "hasOne",
      description: `has one ${typeNameOf(this.type.label.name)}`
    };
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

export function hasOne(entity: Type, options: JSONValue = null): Type {
  return new PointerImpl({
    type: "Pointer",
    args: entity,
    metadata: options,
    name: null,
    required: false,
    features: []
  });
}
