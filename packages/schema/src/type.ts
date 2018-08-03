import { ValidationBuilder } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { builder, resolved } from "./descriptors";

/**
 * Internals Vocabulary:
 *
 * Reference Type:
 *   Represents data that is not directly included in the parent object.
 *   Dereferencing a reference may be asynchronous.
 *
 * Inline Type:
 *   Represent data that is directly included in the parent object.
 *   They include scalars, lists and dictionaries.
 *
 * Value:
 *   A value of any type (reference or inline).
 *
 * Scalar (Inline):
 *   A single inline value.
 *
 * List (Inline):
 *   A list of inline values.
 *
 * Dictionary (Inline):
 *   A set of key-value pairs. A dictionary's values are inline value. A dictionary's keys are strings.
 *
 * Pointer (Reference):
 *   A reference to another value.
 *
 * Iterator (Reference):
 *   A reference to a sequence of values. Each iteration of an iterator may be asynchronous.
 *
 * Refined Type:
 *   A type that has a strict component and a draft component. Component must either both be inline
 *   or both be references. A type's draft component corresponds to distinctions in underlying
 *   storage and user interface elements, and is intended to make it possible to auto-save
 *   in-progress work in a user interface.
 */

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

export interface BuilderMetadata {
  features: Option<string[]>;
  required: Option<boolean>;
}

export const METADATA = Symbol("METADATA");

export interface TypeBuilder<
  D extends builder.Descriptor = builder.Descriptor
> {
  readonly [METADATA]: BuilderMetadata;
  readonly descriptor: D;

  named(name: string): TypeBuilder;

  required(isRequiredType?: boolean): TypeBuilder;

  features(features: string[]): TypeBuilder;
}
