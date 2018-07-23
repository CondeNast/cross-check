import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import {
  IteratorDescriptor,
  PointerDescriptor,
  TypeDescriptor
} from "../../descriptors";
import { ANY, AbstractType } from "./core";

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
