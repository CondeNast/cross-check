import { ValidationBuilder } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { resolved } from "../../descriptors";
import { ANY, AbstractType } from "./core";

export abstract class ReferenceImpl<
  R extends resolved.Iterator | resolved.Pointer
> extends AbstractType<R> {
  protected get type(): resolved.Descriptor {
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
