import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import { maybe } from "../utils";
import { Alias } from "./alias";
import {
  AliasDescriptor,
  RequiredDescriptor,
  TypeDescriptor
} from "./descriptor";
import { Required } from "./required";

export const Pass = Symbol();
export type Pass = typeof Pass;

export interface Type<Descriptor extends TypeDescriptor = TypeDescriptor> {
  readonly base: Type;
  readonly descriptor: Descriptor;

  required(isRequired?: boolean): Type;
  named(arg: string): Type<AliasDescriptor>;
  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown | Pass;
  parse(input: unknown): unknown | Pass;
}

export abstract class AbstractType<
  Descriptor extends TypeDescriptor = TypeDescriptor
> implements Type<Descriptor> {
  abstract readonly base: Type;

  constructor(readonly descriptor: Descriptor) {}

  named(name: string): Type<AliasDescriptor> {
    return Alias(name, this);
  }

  required(isRequired = true): Type {
    return Required(this, isRequired);
  }

  // feature(name: string): this {
  //   let features = [...this.features, name];
  //   return this.clone({ features });
  // }

  abstract validation(): ValidationBuilder<unknown>;
  abstract serialize(input: unknown): unknown | Pass;
  abstract parse(input: unknown): unknown | Pass;
}

// TODO: Moving into separate file requires figuring out cycles
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

export class RequiredType extends AbstractType<RequiredDescriptor> {
  private get type(): Type {
    return this.descriptor.args.type;
  }

  private get isWrapperRequired(): boolean {
    return this.descriptor.args.required;
  }

  get base(): Type {
    return new RequiredType({
      ...this.descriptor,
      args: { type: this.type.base, required: false }
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
    return serialize(input, !this.isWrapperRequired, value =>
      this.type.serialize(value)
    );
  }

  parse(input: unknown): unknown {
    return parse(input, !this.isWrapperRequired, value =>
      this.type.parse(value)
    );
  }
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
