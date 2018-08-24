import Task from "no-show";
import { Option, dict, isIndexable } from "ts-std";

import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  ValidatorFactory,
  Validity,
  valid,
  validate
} from "@cross-check/core";
import build, {
  ValidationBuildable,
  ValidationBuilder,
  validates
} from "@cross-check/dsl";

export const presence = builder("presence");
export const str = builder("str");
export const email = builder<unknown, string, { tlds: string[] }>("email");
export const isEmail = builder<string, string, { tlds: string[] }>("isEmail");
export const uniqueness = builder("uniqueness");

let factories = dict<ValidatorFactory<unknown, unknown, unknown>>();

export function factory(
  name: string
): ValidatorFactory<unknown, unknown, unknown> {
  if (!factories[name]) {
    factories[name] = () => {
      return () => new Task(async v => valid(v));
    };
  }
  return factories[name]!;
}

function builder<T = unknown, U extends T = T, Options = unknown>(
  name: string
): () => ValidationBuilder<T, U>;
function builder<T, U extends T, Options>(
  name: string
): (options: Options) => ValidationBuilder<T, U>;
function builder(
  name: string
): (options: any) => ValidationBuilder<unknown, unknown> {
  return (options: any) => validates(name, factory(name), options);
}

export class Env implements Environment {
  get(object: unknown, key: string): unknown {
    return isIndexable(object) ? object[key] : undefined;
  }

  asArray(object: unknown): Option<Iterator<unknown>> {
    if (Array.isArray(object)) {
      return object[Symbol.iterator]();
    } else {
      return null;
    }
  }
}

export function buildAndRun<T, U extends T>(
  b: ValidationBuildable<T, U>,
  value: T
): Task<Validity<T, U>> {
  return run(build(b), value);
}

export function run<T, U extends T>(
  descriptor: ValidationDescriptor<T, U>,
  value: T
): Task<Validity<T, U>> {
  return validate(value, descriptor, null, new Env());
}
