import { Task } from 'no-show';
import { unknown } from 'ts-std';

export type ErrorPath = ReadonlyArray<string>;

export interface ErrorMessage {
  key: string;
  args: unknown;
}

export interface ValidationError {
  path: ErrorPath;
  message: ErrorMessage;
}

export interface Environment {
  get(object: unknown, key: string): unknown;
}

export type ValidatorFactory<Options> = (env: Environment, options: Options) => Validator;

export type Validator = (value: unknown) => Task<ValidationError[]>;

export type ValidationDescriptor<Options = unknown> = Readonly<{
  factory: ValidatorFactory<Options>;
  options: Options;
  contexts: ReadonlyArray<string>;
}>;
