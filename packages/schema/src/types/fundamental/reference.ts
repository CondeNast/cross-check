import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { ANY } from "../std/scalars";
import {
  IteratorDescriptor,
  PointerDescriptor,
  TypeDescriptor
} from "./descriptor";
import { AbstractType } from "./value";

export abstract class ReferenceImpl extends AbstractType<
  IteratorDescriptor | PointerDescriptor
> {
  constructor(readonly descriptor: IteratorDescriptor | PointerDescriptor) {
    super(descriptor);
  }

  protected get type(): TypeDescriptor {
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
