import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { BuilderMetadata, METADATA, Type, TypeBuilder } from "../../type";
import { maybe } from "../../utils";

// This class basically exists to make the constructor argument generic.
export abstract class AbstractType<D extends resolved.Descriptor>
  implements Type<resolved.Descriptor> {
  constructor(readonly descriptor: D) { }

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown;
  abstract parse(input: unknown): unknown;
}

export function getFeatures(typeBuilder: TypeBuilder): string[] | undefined {
  return typeBuilder[METADATA].features || undefined;
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

export function Optionality(
  inner: resolved.Descriptor,
  isOptional: boolean
): resolved.Optionality {
  return {
    type: "Optionality",
    args: { isOptional },
    inner,
    instantiate: (desc: resolved.Optionality) => new OptionalityType(desc)
  };
}

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const ANY = builderFor(AnyValidator)();

const DEFAULT_METADATA = {
  features: null,
  required: null
};

export class TypeBuilderImpl<
  D extends builder.Descriptor = builder.Descriptor
  > {
  readonly [METADATA]: BuilderMetadata;

  constructor(
    readonly descriptor: D,
    builderMetadata: BuilderMetadata = DEFAULT_METADATA
  ) {
    this[METADATA] = builderMetadata;
  }

  named(name: string): TypeBuilder {
    return new TypeBuilderImpl(
      AliasBuilder(this.descriptor, name),
      this[METADATA]
    );
  }

  required(isRequiredType = true): TypeBuilder {
    return new TypeBuilderImpl(this.descriptor, {
      ...this[METADATA],
      required: isRequiredType
    });
  }

  features(features: string[]): TypeBuilder {
    // TODO: Concat with old features?
    return new TypeBuilderImpl(this.descriptor, {
      ...this[METADATA],
      features
    });
  }
}

export function isDescriptor(
  value: TypeBuilder | builder.Descriptor
): value is builder.Descriptor {
  return !(value instanceof TypeBuilderImpl);
}

export function AliasBuilder(
  inner: builder.Descriptor,
  name: string
): builder.Alias {
  return {
    type: "Alias",
    name,
    inner
  };
}
