import { Task } from 'no-show';
import { unknown } from 'ts-std';

export type ErrorPath = ReadonlyArray<string>;

export interface ErrorMessage {
  key: string;
  args: unknown;
}

export interface ValidationError<Message extends ErrorMessage> {
  path: ErrorPath;
  message: Message;
}

export interface Environment {
  get(object: unknown, key: string): unknown;
}

export type ValidatorFactory<Options = unknown, Message extends ErrorMessage = ErrorMessage> =
  (env: Environment, options: Options) => Validator<Message>;

export type Validator<Message extends ErrorMessage> =
  (value: unknown) => Task<Array<ValidationError<Message>>>;

export type ValidationDescriptor<Options = unknown> = Readonly<{
  factory: ValidatorFactory<Options, ErrorMessage>;
  options: Options;
  contexts: ReadonlyArray<string>;
}>;

export type ValidationDescriptors = ReadonlyArray<ValidationDescriptor>;
