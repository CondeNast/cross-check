import { JSON, Option } from "ts-std";
import { IteratorLabel, Label, typeNameOf } from "../label";
import { ReferenceImpl } from "./reference";
import { Type } from "./value";

export class IteratorImpl extends ReferenceImpl {
  constructor(
    private inner: Type,
    private name: string | undefined,
    private args: JSON | undefined,
    isRequired: boolean
  ) {
    super(isRequired);
  }

  get base(): Type {
    return new IteratorImpl(this.inner.base, this.name, this.args, false);
  }

  get label(): Label<IteratorLabel> {
    let inner = this.inner.required();

    return {
      type: {
        kind: "iterator",
        of: inner
      },
      args: this.args,
      description: `hasMany ${typeNameOf(inner.label.name)}`,
      name: "hasMany"
    };
  }

  required(isRequired = true): Type {
    return new IteratorImpl(this.inner, this.name, this.args, isRequired);
  }

  named(arg: Option<string>): Type {
    return new IteratorImpl(
      this.inner,
      arg === null ? undefined : arg,
      this.args,
      this.isRequired
    );
  }
}

export function hasMany(item: Type, options?: JSON): Type {
  return new IteratorImpl(item, undefined, options, false);
}
