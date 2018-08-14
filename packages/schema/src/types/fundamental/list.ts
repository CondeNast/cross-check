import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { registered, resolved } from "../../descriptors";
import { Type } from "../../type";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

export class ListImpl implements Type {
  constructor(private inner: Type, private args: resolved.ListArgs) {}

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
  contents: registered.TypeBuilder,
  options?: { allowEmpty: boolean }
): registered.ListBuilder {
  return new registered.ListBuilder({
    args: options,
    contents
  });
}
