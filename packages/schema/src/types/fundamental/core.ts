import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import {
  AliasDescriptor,
  ContainerDescriptor,
  Factory,
  RequiredDescriptor,
  TypeDescriptor,
  factory
} from "../../descriptors";
import { maybe } from "../../utils";

/**
 * The API for a Type in Crosscheck. It essentially provides the runtime code
 * for a descriptor:
 *
 * - `validation()`, which provides a validation rule for the descriptor
 * - `serialize()`, which takes an already-validated value and serializes it
 *   into the wire format.
 * - `parse()`, which takes a valid serialized value and parses it into
 *   the JS representation.
 */
export interface Type<Descriptor extends TypeDescriptor = TypeDescriptor> {
  readonly descriptor: Descriptor;

  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown;
  parse(input: unknown): unknown;
}

// This class basically exists to make the constructor argument generic.
export abstract class AbstractType<Descriptor extends TypeDescriptor>
  implements Type<Descriptor> {
  constructor(readonly descriptor: Descriptor) {}

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown;
  abstract parse(input: unknown): unknown;
}

/**
 * Takes a `TypeDescriptor` and produces a `Type`. This works by invoking
 * the `instantiate` factory function inside of the type descriptor with
 * the descriptor.
 *
 * @param descriptor a `TypeDescriptor`
 */
export function instantiate<D extends TypeDescriptor, T extends Type<D>>(
  descriptor: D
): T {
  let instantiateFactory = (descriptor.factory as Factory<D, T>).instantiate;
  return instantiateFactory(descriptor);
}

/**
 * Transform a `TypeDescriptor`.
 *
 * @param desc a `TypeDescriptor`
 * @param callback a function that takes a `TypeBuilder` for the descriptor
 *   and returns a `TypeBuilder` that reflects the transformation
 */
export function transform(
  desc: TypeDescriptor,
  callback: (type: TypeBuilder) => TypeBuilder
): TypeDescriptor {
  return callback(new TypeBuilder(desc)).descriptor;
}

/**
 * Takes a `TypeDescriptor` and returns its `base` type. This works by
 * invoking the `base` factory function inside of the type descriptor
 * with the descriptor.
 *
 * @param descriptor a `TypeDescriptor`
 */
export function base<D extends TypeDescriptor, T extends Type<D>>(
  descriptor: D
): TypeDescriptor {
  let baseFactory = (descriptor.factory as Factory<D, T>).base;
  return baseFactory(descriptor);
}

/**
 * Takes a `TypeDescriptor` and produces a named alias for it.
 *
 * @param descriptor a `TypeDescriptor`
 * @param name the new name of the type
 */
export function alias(
  descriptor: TypeDescriptor,
  name: string
): AliasDescriptor {
  return {
    type: "Alias",
    factory: {
      instantiate(desc: AliasDescriptor) {
        return instantiate(desc.inner);
      },

      base(desc: AliasDescriptor) {
        return base(desc.inner);
      }
    },
    metadata: null,
    inner: descriptor,
    args: null,
    name,
    description: `alias`
  };
}

/**
 * Takes a `TypeDescriptor` and makes it either required or optional.
 *
 * @param desc a `TypeDescriptor`
 * @param isRequired is the descriptor required?
 */
export function required(
  desc: TypeDescriptor,
  isRequired = true
): RequiredDescriptor {
  return {
    type: "Required",
    factory: factory(RequiredType),
    metadata: null,
    inner: desc,
    args: { required: isRequired },
    description: "required"
  };
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
    return new TypeBuilder(alias(this.descriptor, name));
  }

  required(isRequired = true): TypeBuilder {
    return new TypeBuilder(required(this.descriptor, isRequired));
  }

  features(_features: string[]): TypeBuilder {
    throw new Error("not implemented");
  }
}

export abstract class AbstractContainerType<
  Descriptor extends ContainerDescriptor
> extends AbstractType<Descriptor> {
  protected get type(): Type {
    return instantiate(this.descriptor.inner);
  }

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

  static base(desc: RequiredDescriptor): TypeDescriptor {
    return {
      ...desc,
      inner: base(desc.inner),
      args: { required: false }
    };
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

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const ANY = builderFor(AnyValidator)();
