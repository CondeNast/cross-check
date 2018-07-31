import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
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
export interface Type<
  Descriptor extends resolved.Descriptor = resolved.Descriptor
> {
  readonly descriptor: Descriptor;

  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown;
  parse(input: unknown): unknown;
}

// This class basically exists to make the constructor argument generic.
export abstract class AbstractType<D extends resolved.Descriptor>
  implements Type<resolved.Descriptor> {
  constructor(readonly descriptor: D) {}

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown;
  abstract parse(input: unknown): unknown;
}

export interface BuilderMetadata {
  features: Option<string[]>;
  required: Option<boolean>;
}

const DEFAULT_METADATA = {
  features: null,
  required: null
};

export class TypeBuilder<D extends builder.Descriptor = builder.Descriptor> {
  constructor(
    readonly descriptor: D,
    /** @internal */
    readonly builderMetadata: BuilderMetadata = DEFAULT_METADATA
  ) {}

  named(name: string): TypeBuilder {
    return new TypeBuilder(
      builder.Alias(this.descriptor, name),
      this.builderMetadata
    );
  }

  required(isRequiredType = true): TypeBuilder {
    return new TypeBuilder(this.descriptor, {
      ...this.builderMetadata,
      required: isRequiredType
    });
  }

  features(features: string[]): TypeBuilder {
    // TODO: Concat with old features?
    return new TypeBuilder(this.descriptor, {
      ...this.builderMetadata,
      features
    });
  }
}

export function getFeatures(typeBuilder: TypeBuilder): string[] | undefined {
  return typeBuilder.builderMetadata.features || undefined;
}

export abstract class AbstractContainerType<
  Descriptor extends resolved.ContainerDescriptor
> extends AbstractType<Descriptor> {
  protected get type(): Type {
    return resolved.instantiate(this.descriptor.inner);
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

export class OptionalityType extends AbstractContainerType<
  resolved.Optionality
> {
  validation(): ValidationBuilder<unknown> {
    if (this.isOptional) {
      return maybe(this.type.validation());
    } else {
      return validators.isPresent().andThen(this.type.validation());
    }
  }

  serialize(input: unknown): unknown {
    if (input === null) {
      assert(
        this.isOptional,
        "Serialization error: unexpected null (must validate before serializing)"
      );

      return input;
    } else {
      return super.serialize(input);
    }
  }

  parse(input: unknown): unknown {
    if (input === null) {
      assert(this.isOptional, "Parse error: unexpected null.");
      return null;
    } else {
      return super.parse(input);
    }
  }

  private get isOptional(): boolean {
    return this.descriptor.args.isOptional;
  }
}

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const ANY = builderFor(AnyValidator)();
