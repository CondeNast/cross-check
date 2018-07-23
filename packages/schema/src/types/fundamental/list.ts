import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { ListDescriptor, TypeDescriptor, factory } from "../../descriptors";
import { AbstractType, Type, TypeBuilder, base, instantiate } from "./core";
import { isRequired } from "./required";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

class ArrayImpl extends AbstractType<ListDescriptor> {
  protected get type(): Type {
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
    let itemType = this.defaultItem;

    return js.map(item => itemType.serialize(item));
  }

  parse(wire: any[]): any {
    let itemType = this.defaultItem;

    return wire.map(item => itemType.parse(item));
  }

  validation(): ValidationBuilder<unknown> {
    let validator = validators.array(this.defaultItem.validation());

    if (!this.descriptor.args.allowEmpty) {
      validator = validator.andThen(isPresentArray());
    }

    return validator;
  }

  private get defaultItem(): Type {
    // TODO: Do this at transformation / tree walk

    // List items are required by default
    let desc: TypeDescriptor;

    if (isRequired(this.type.descriptor) === null) {
      desc = new TypeBuilder(this.descriptor.inner).required().descriptor;
    } else {
      desc = this.descriptor.inner;
    }

    return instantiate(desc);
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
    inner: item.descriptor,
    args: { allowEmpty },
    metadata: null
  });
}
