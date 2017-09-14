import { Task } from 'no-show';
import { Option, unknown } from 'ts-std';

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

export type ValidatorFactory<T, Options> = (env: Environment, options: Options) => Validator<T>;

export type Validator<T = unknown> = (value: T, context: Option<string>) => Task<ValidationError[]>;

export type ValidationDescriptor<T = unknown, Options = unknown> = Readonly<{
  factory: ValidatorFactory<T, Options>;
  options: Options;
  contexts: ReadonlyArray<string>;
}>;
