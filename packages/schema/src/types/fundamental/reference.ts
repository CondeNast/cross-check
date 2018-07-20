import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { ANY } from "../std/scalars";
import { IteratorDescriptor, PointerDescriptor } from "./descriptor";
import { AbstractType, Type, TypeBuilder } from "./value";

export abstract class ReferenceImpl extends AbstractType {
  abstract readonly base: TypeBuilder;

  constructor(readonly descriptor: IteratorDescriptor | PointerDescriptor) {
    super(descriptor);
  }

  protected get type(): Type {
    return this.descriptor.inner;
  }

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
