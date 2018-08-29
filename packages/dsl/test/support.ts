import Task from "no-show";
import { Option, dict, isIndexable } from "ts-std";

import {
  ObjectModel,
  ValidationDescriptor,
  ValidationError,
  ValidatorFactory,
  validate
} from "@cross-check/core";
import build, {
  ValidationBuildable,
  ValidationBuilder,
  validates
} from "@cross-check/dsl";

export const presence = builder("presence");
export const str = builder("str");
export const email = builder<unknown, { tlds: string[] }>("email");
export const isEmail = builder<string, { tlds: string[] }>("isEmail");
export const uniqueness = builder("uniqueness");

let factories = dict<ValidatorFactory<unknown, unknown>>();

export function factory(name: string): ValidatorFactory<unknown, unknown> {
  if (!factories[name]) {
    factories[name] = () => {
      return () => new Task(async () => []);
    };
  }
  return factories[name]!;
}

function builder<T = unknown>(name: string): () => ValidationBuilder<T>;
function builder<T, Options>(
  name: string
): (options: Options) => ValidationBuilder<T>;
function builder(name: string): (options: any) => ValidationBuilder<unknown> {
  return (options: any) => validates(name, factory(name), options);
}

export class Obj implements ObjectModel {
  get(object: unknown, key: string): unknown {
    return isIndexable(object) ? object[key] : undefined;
  }

  asList(object: unknown): Option<Array<unknown>> {
    if (Array.isArray(object)) {
      return object;
    } else {
      return null;
    }
  }
}

export function defaultRun<T>(
  b: ValidationBuildable<T>,
  value: T
): Task<ValidationError[]> {
  return run(build(b), value, new Obj());
}

export function buildAndRun<T>(
  b: ValidationBuildable<T>,
  value: T,
  env: ObjectModel = new Obj()
): Task<ValidationError[]> {
  return run(build(b), value, env);
}

export function run<T>(
  descriptor: ValidationDescriptor<T>,
  value: T,
  env: ObjectModel = new Obj()
): Task<ValidationError[]> {
  return validate(value, descriptor, null, env);
}
