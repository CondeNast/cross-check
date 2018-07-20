import { ValidationBuilder, validators } from "@cross-check/dsl";
import { assert, unknown } from "ts-std";
import { maybe } from "../utils";
import {
  AliasDescriptor,
  ContainerDescriptor,
  RequiredDescriptor,
  TypeDescriptor
} from "./descriptor";

export interface Type<Descriptor extends TypeDescriptor = TypeDescriptor> {
  readonly descriptor: Descriptor;

  // This should probably be a static that is a (Descriptor) => Descriptor
  readonly base: Type;

  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown;
  parse(input: unknown): unknown;
}

export abstract class AbstractType<Descriptor extends TypeDescriptor>
  implements Type<Descriptor> {
  abstract readonly base: Type;

  constructor(readonly descriptor: Descriptor) {}

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown;
  abstract parse(input: unknown): unknown;
}

export function instantiate(descriptor: TypeDescriptor): Type {
  let factory = descriptor.factory as (descriptor: TypeDescriptor) => Type;
  return factory(descriptor);
}

export class TypeBuilder {
  // TODO: If we need this at the very end of the refactor, we failed
  // This is because design-time to runtime should be a one-way trip.
  // We probably need some conveniences to make it true.
  static fromType(type: Type): TypeBuilder {
    return new TypeBuilder(type.descriptor);
  }

  constructor(readonly descriptor: TypeDescriptor) {}

  toType(): Type {
    return instantiate(this.descriptor);
  }

  named(name: string): TypeBuilder {
    return new TypeBuilder({
      type: "Alias",
      factory: (desc: AliasDescriptor) => instantiate(desc.inner),
      metadata: null,
      inner: this.descriptor,
      args: null,
      name,
      description: `alias`
    });
  }

  required(isRequired = true): TypeBuilder {
    // if (this.descriptor.type === "Required") {
    //   return Required(type.descriptor.inner, isTypeRequired);
    // }

    return new TypeBuilder({
      type: "Required",
      factory: (desc: RequiredDescriptor) => new RequiredType(desc),
      metadata: null,
      inner: this.descriptor,
      args: { required: isRequired },
      description: "required"
    });
  }

  features(features: string[]): TypeBuilder {
    throw new Error("not implemented");
  }
}

export abstract class AbstractContainerType<
  Descriptor extends ContainerDescriptor
> extends AbstractType<Descriptor> {
  protected get type(): Type {
    return instantiate(this.descriptor.inner);
  }

  abstract base: Type;

  validation(): ValidationBuilder<unknown> {
    return this.type.validation();
  }

  serialize(input: unknown): unknown {
    return this.type.serialize(input);
  }

  parse(input: unknown): unknown {
    return this.type.parse(input);
  }
}

// TODO: Moving into separate file requires figuring out cycles
export class RequiredType extends AbstractContainerType<RequiredDescriptor> {
  private get isWrapperRequired(): boolean {
    return this.descriptor.args.required;
  }

  get base(): Type {
    // return Required(this, false);
    return new RequiredType({
      ...this.descriptor,
      inner: this.type.base.descriptor,
      args: { required: false }
    });
  }

  validation(): ValidationBuilder<unknown> {
    if (this.isWrapperRequired) {
      return validators.isPresent().andThen(this.type.validation());
    } else {
      return maybe(this.type.validation());
    }
  }

  serialize(input: unknown): unknown {
    if (input === null) {
      assert(
        !this.isWrapperRequired,
        "Serialization error: unexpected null (must validate before serializing)"
      );

      return input;
    } else {
      return super.serialize(input);
    }
  }

  parse(input: unknown): unknown {
    if (input === null) {
      assert(!this.isWrapperRequired, "Parse error: unexpected null.");
      return null;
    } else {
      return super.parse(input);
    }
  }
}
