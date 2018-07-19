import { ValidationBuilder, validators } from "@cross-check/dsl";
import { assert, unknown } from "ts-std";
import { maybe } from "../utils";
import { Alias } from "./alias";
import {
  AliasDescriptor,
  ContainerDescriptor,
  FeaturesDescriptor,
  RequiredDescriptor,
  TypeDescriptor
} from "./descriptor";
import { Features } from "./features";
import { Required } from "./required";

export interface Type<Descriptor extends TypeDescriptor = TypeDescriptor> {
  readonly base: Type;
  readonly descriptor: Descriptor;

  required(isRequired?: boolean): Type;
  named(arg: string): Type;
  features(features: string[]): Type;
  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown;
  parse(input: unknown): unknown;
}

export abstract class AbstractType<
  Descriptor extends TypeDescriptor = TypeDescriptor
> implements Type<Descriptor> {
  abstract readonly base: Type;

  constructor(readonly descriptor: Descriptor) {}

  named(name: string): Type {
    return Alias(this, name);
  }

  required(isRequired = true): Type {
    return Required(this, isRequired);
  }

  features(features: string[]): Type {
    return Features(this, features);
  }

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown;
  abstract parse(input: unknown): unknown;
}

export abstract class AbstractContainerType<
  Descriptor extends ContainerDescriptor
> extends AbstractType<Descriptor> {
  protected get type(): Type {
    return this.descriptor.inner;
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
export class AliasType extends AbstractContainerType<AliasDescriptor> {
  get base(): Type {
    return new AliasType({
      ...this.descriptor,
      isBase: true,
      inner: this.type.base
    });
  }
}

export class FeaturesType extends AbstractContainerType<FeaturesDescriptor> {
  get base(): Type {
    return new FeaturesType({
      ...this.descriptor,
      inner: this.type.base
    });
  }
}

export class RequiredType extends AbstractContainerType<RequiredDescriptor> {
  private get isWrapperRequired(): boolean {
    return this.descriptor.args.required;
  }

  get base(): Type {
    // return Required(this, false);
    return new RequiredType({
      ...this.descriptor,
      inner: this.type.base,
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
