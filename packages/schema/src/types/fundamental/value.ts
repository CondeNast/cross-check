import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import { maybe } from "../utils";
import { AliasDescriptor, TypeDescriptor } from "./descriptor";

export const Pass = Symbol();
export type Pass = typeof Pass;

export interface Type<Descriptor extends TypeDescriptor = TypeDescriptor> {
  readonly base: Type<Descriptor>;
  readonly isRequired: boolean;
  readonly descriptor: Descriptor;

  required(isRequired?: boolean): Type<Descriptor>;
  named(arg: string): Type<AliasDescriptor>;
  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown | Pass;
  parse(input: unknown): unknown | Pass;
}

export abstract class AbstractType<
  Descriptor extends TypeDescriptor = TypeDescriptor
> implements Type<Descriptor> {
  abstract readonly base: Type<Descriptor>;

  constructor(readonly descriptor: Descriptor) {}

  get isRequired(): boolean {
    return this.descriptor.required;
  }

  named(name: string): Type<AliasDescriptor> {
    return Alias(name, this);
  }

  required(isRequired = true): Type<Descriptor> {
    return new (this.constructor as any)({
      ...(this.descriptor as object),
      required: isRequired
    });
  }

  // feature(name: string): this {
  //   let features = [...this.features, name];
  //   return this.clone({ features });
  // }

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown | Pass;
  abstract parse(input: unknown): unknown | Pass;
}

export class AliasType extends AbstractType<AliasDescriptor> {
  private get type(): Type {
    return this.descriptor.args;
  }

  get base(): AliasType {
    return new AliasType({
      ...this.descriptor,
      args: this.type.base
    });
  }

  get isRequired(): boolean {
    return this.type.isRequired;
  }

  named(name: string): AliasType {
    return new AliasType({
      ...this.descriptor,
      args: this.type.named(name)
    });
  }

  required(isRequired = true): AliasType {
    return new AliasType({
      ...this.descriptor,
      args: this.type.required(isRequired)
    });
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

export function Alias(name: string, type: Type): AliasType {
  return new AliasType({
    type: "Alias",
    metadata: null,
    args: type,
    name,
    description: `${name} (alias for ${type.descriptor.description})`,
    required: false,
    features: []
  });
}

export function validationFor(
  builder: ValidationBuilder<unknown>,
  required: boolean
): ValidationBuilder<unknown> {
  if (required) {
    return validators.isPresent().andThen(builder);
  } else {
    return maybe(builder);
  }
}

export function serialize<T, C extends (value: T) => unknown>(
  value: T,
  nullable: false,
  serializeValue: C
): ReturnType<C>;
export function serialize<T, C extends (value: T) => unknown>(
  value: Option<T>,
  nullable: true,
  serializeValue: C
): ReturnType<C> | null;
export function serialize<T, C extends (value: T) => unknown>(
  value: Option<T>,
  // tslint:disable-next-line:unified-signatures
  nullable: boolean,
  serializeValue: C
): ReturnType<C> | null;

export function serialize<T, C extends (value: T) => unknown>(
  value: Option<T>,
  nullable: boolean,
  serializeValue: C
): ReturnType<C> | null {
  if (value === null) {
    assert(
      nullable,
      "Serialization error: unexpected null (must validate before serializing)"
    );
    return value;
  } else {
    return serializeValue(value) as ReturnType<C>;
  }
}

export function parse<T, C extends (value: T) => unknown>(
  value: Option<T>,
  nullable: true,
  parseValue: C
): ReturnType<C> | null;
export function parse<T, C extends (value: T) => unknown>(
  value: T,
  nullable: false,
  parseValue: C
): ReturnType<C>;
export function parse<T, C extends (value: T) => unknown>(
  value: Option<T>,
  // tslint:disable-next-line:unified-signatures
  nullable: boolean,
  parseValue: C
): ReturnType<C> | null;

export function parse<T, C extends (value: T) => unknown>(
  value: Option<T>,
  nullable: boolean,
  parseValue: C
): ReturnType<C> | null {
  if (value === null) {
    assert(nullable, "Parse error: unexpected null.");
    return null;
  } else {
    return parseValue(value) as ReturnType<C>;
  }
}
