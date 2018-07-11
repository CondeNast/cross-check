import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Option, assert, unknown } from "ts-std";
import { Label, NamedLabel, TypeLabel } from "../label";
import { maybe } from "../utils";
import { TypeDescriptor } from "./descriptor";

export const Pass = Symbol();
export type Pass = typeof Pass;

export interface Type {
  readonly label: Label;
  readonly base: Type;
  readonly isRequired: boolean;
  readonly descriptor: TypeDescriptor;

  required(isRequired?: boolean): Type;
  named(arg: Option<string>): Type;
  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown | Pass;
  parse(input: unknown): unknown | Pass;
}

export abstract class AbstractType implements Type {
  abstract readonly label: Label;
  abstract readonly base: Type;

  constructor(readonly descriptor: TypeDescriptor) {}

  get isRequired(): boolean {
    return this.descriptor.required;
  }

  named(name: Option<string>): this {
    return new (this.constructor as any)({
      ...this.descriptor,
      name
    });
  }

  required(isRequired = true): this {
    return new (this.constructor as any)({
      ...this.descriptor,
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

export interface LabelledType<L extends TypeLabel = TypeLabel> extends Type {
  readonly label: Label<L>;
}

export interface NamedType<L extends TypeLabel = TypeLabel>
  extends LabelledType<L> {
  label: NamedLabel<L>;
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
