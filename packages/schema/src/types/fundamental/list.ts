import { ValidationBuilder, validators } from "@cross-check/dsl";
import { builders, dehydrated } from "../../descriptors";
import { Type } from "../../type";

const isPresentArray = validators.is(
  (value: Array<unknown>): value is Array<unknown> => value.length > 0,
  "present-array"
);

export interface ListArgs {
  readonly allowEmpty: boolean;
}

export class ListImpl implements Type {
  constructor(private inner: Type, private args: ListArgs) {}

  dehydrate(): dehydrated.List {
    return {
      type: "List",
      args: this.args,
      inner: this.inner.dehydrate(),
      required: true
    };
  }

  serialize(js: any[]): any {
    let itemType = this.inner;

    return js.map(item => itemType.serialize(item));
  }

  parse(wire: any[]): any {
    let itemType = this.inner;

    return wire.map(item => itemType.parse(item));
  }

  validation(): ValidationBuilder<unknown> {
    let validator = validators.array(this.inner.validation());

    if (!this.args.allowEmpty) {
      validator = validator.andThen(isPresentArray());
    }

    return validator;
  }
}

export function List(
  contents: builders.TypeBuilder,
  options?: { allowEmpty: boolean }
): builders.ListBuilder {
  return new builders.ListBuilder({
    args: options,
    contents: contents.required()
  });
}
