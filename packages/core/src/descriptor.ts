import { Dict, unknown } from 'ts-std';

export type ValidationDescriptor = Readonly<{
  validator: Readonly<{ name: string, args: ReadonlyArray<unknown> }>;
  keys: ReadonlyArray<string>;
  contexts: ReadonlyArray<string>;
}>;

export type ValidationDescriptors = ReadonlyArray<ValidationDescriptor>;

export type FieldValidationDescriptors = Readonly<Dict<ValidationDescriptors>>;
