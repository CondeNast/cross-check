import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { Type, TypeBuilder } from "../../type";
import { AbstractType, TypeBuilderImpl } from "./core";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

class ArrayImpl extends AbstractType<resolved.List> {
  protected get inner(): Type {
    return resolved.instantiate(this.descriptor.inner);
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

    if (!this.descriptor.args.allowEmpty) {
      validator = validator.andThen(isPresentArray());
    }

    return validator;
  }
}

export function List(
  item: TypeBuilder | builder.Descriptor,
  options: { allowEmpty: boolean } = { allowEmpty: false }
): TypeBuilder {
  return new TypeBuilderImpl(
    builder.List(
      "descriptor" in item ? item.descriptor : item,
      ArrayImpl,
      options
    )
  );
}
