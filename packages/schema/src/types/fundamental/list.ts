import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { ListDescriptor, TypeDescriptor, factory } from "../../descriptors";
import {
  AbstractType,
  Type,
  TypeBuilder,
  base,
  buildType,
  instantiate
} from "./core";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

class ArrayImpl extends AbstractType<ListDescriptor> {
  protected get inner(): Type {
    return instantiate(this.descriptor.inner);
  }

  static base(descriptor: ListDescriptor): TypeDescriptor {
    return {
      ...descriptor,
      inner: base(descriptor.inner),
      args: { allowEmpty: true }
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

    if (!this.descriptor.args.allowEmpty) {
      validator = validator.andThen(isPresentArray());
    }

    return validator;
  }
}

export function List(
  item: TypeBuilder,
  { allowEmpty }: { allowEmpty: boolean } = { allowEmpty: false }
): TypeBuilder {
  return new TypeBuilder({
    type: "List",
    factory: factory(ArrayImpl),
    description: "List",
    inner: buildType(item.descriptor, { position: "List" }),
    args: { allowEmpty },
    metadata: null
  });
}
