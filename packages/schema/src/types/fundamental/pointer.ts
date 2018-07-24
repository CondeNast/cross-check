import { ValidationBuilder } from "@cross-check/dsl";
import { Option } from "ts-std";
import { Label, PointerLabel, typeNameOf } from "../label";
import { ANY } from "../std/scalars";
import { ReferenceImpl } from "./reference";
import { Type } from "./value";

export class PointerImpl extends ReferenceImpl {
  constructor(
    private inner: Type,
    isRequired: boolean,
    private name: string | undefined
  ) {
    super(isRequired);
  }

  get base(): Type {
    return new PointerImpl(this.inner.base.required(), false, undefined);
  }

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        of: this.inner
      },
      name: "hasOne",
      description: `has one ${typeNameOf(this.inner.label.name)}`
    };
  }

  required(isRequired = true): Type {
    return new PointerImpl(this.inner, isRequired, this.name);
  }

  named(arg: Option<string>): Type {
    return new PointerImpl(
      this.inner,
      this.isRequired,
      arg === null ? undefined : arg
    );
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

export function hasOne(entity: Type): Type {
  return new PointerImpl(entity.required(), false, undefined);
}
