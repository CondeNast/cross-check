import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { PointerDescriptor, TypeDescriptor, factory } from "../../descriptors";
import { Record } from "../../record";
import { JSONValue } from "../../utils";
import { ANY, TypeBuilder, base, buildType } from "./core";
import { ReferenceImpl } from "./reference";

export class PointerImpl extends ReferenceImpl {
  static base(descriptor: PointerDescriptor): TypeDescriptor {
    return {
      ...descriptor,
      inner: base(descriptor.inner)
    };
  }

  constructor(readonly descriptor: PointerDescriptor) {
    super(descriptor);
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
  return new TypeBuilder({
    type: "Pointer",
    factory: factory(PointerImpl),
    description: `has one ${entity.descriptor.name || "anonymous"}`,
    inner: buildType(entity.descriptor, { position: "Pointer" }),
    args: options,
    metadata: null,
    name: "hasOne"
  });
}
