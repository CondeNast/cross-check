import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { ANY } from "../std/scalars";
import { IteratorDescriptor, PointerDescriptor } from "./descriptor";
import { AbstractType, Type } from "./value";

export abstract class ReferenceImpl extends AbstractType {
  abstract readonly base: Type;

  constructor(readonly descriptor: IteratorDescriptor | PointerDescriptor) {
    super(descriptor);
  }

  protected get type(): Type {
    return this.descriptor.args;
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
