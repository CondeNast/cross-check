import { ValidationError } from "@cross-check/core";
import {
  FormattableRecord,
  GraphqlOptions,
  JSONRecord,
  REGISTRY,
  RecordBuilder,
  Registry,
  TypescriptOptions,
  describe,
  graphql,
  schemaFormat,
  toJSON,
  typescript
} from "@cross-check/schema";
import Task from "no-show";
import { Dict } from "ts-std";
import { register } from "./records";
import { ENV } from "./utils";

QUnit.dump.maxDepth = 100;

export type Test = (
  desc: string,
  callback: (assert: typeof QUnit.assert, state: TestState) => void
) => void;

export type RecordSubjectTest = (
  desc: string,
  callback: (assert: typeof QUnit.assert, state: SubjectTestState) => void
) => void;

export type StringFormatFunction<O = void> = O extends void
  ? ((record: FormattableRecord) => string)
  : ((record: FormattableRecord, options: O) => string);
export type SubjectStringFormatFunction<O = void> = O extends void
  ? (() => string)
  : ((options: O) => string);
export type RecursiveFormatFunction<T> = (record: FormattableRecord) => T;
export type SubjectRecursiveFormatFunction<T> = () => T;

export interface TestState {
  registry: Registry;
  validateDraft: ValidateFunction;
  validateSloppy: ValidateFunction;
  validatePublished: ValidateFunction;
  describe: StringFormatFunction;
  schemaFormat: StringFormatFunction;
  typescript: StringFormatFunction<TypescriptOptions>;
  graphql: StringFormatFunction<GraphqlOptions>;
  toJSON: RecursiveFormatFunction<JSONRecord>;
}

export interface SubjectTestState {
  registry: Registry;
  validateDraft: SubjectValidateFunction;
  validateSloppy: SubjectValidateFunction;
  validatePublished: SubjectValidateFunction;
  describe: SubjectStringFormatFunction;
  schemaFormat: SubjectStringFormatFunction;
  typescript: SubjectStringFormatFunction<TypescriptOptions>;
  graphql: SubjectStringFormatFunction<GraphqlOptions>;
  toJSON: SubjectRecursiveFormatFunction<JSONRecord>;
}

export interface ModuleState {
  registry: Registry;
  test: Test;
}

export interface SubjectModuleState {
  registry: Registry;
  test: RecordSubjectTest;
}

export interface Options {
  beforeEach?: () => void;
  afterEach?: () => void;
}

export interface RecordSubjectOptions extends Options {
  record: RecordBuilder;
}

export function module(
  moduleDescription: string,
  options: RecordSubjectOptions,
  nested?: (test: RecordSubjectTest) => void
): SubjectModuleState;
export function module(
  moduleDescription: string,
  options: Options,
  nested?: (test: Test) => void
): ModuleState;
export function module(
  moduleDescription: string,
  nested?: (test: Test) => void
): ModuleState;
export function module(
  moduleDescription: string,
  hooksOrNested?:
    | ((test: Test) => void)
    | ((test: RecordSubjectTest) => void)
    | Options
    | RecordSubjectOptions,
  nested?: ((test: Test) => void) | ((test: RecordSubjectTest) => void)
): { registry: Registry; test: Test | RecordSubjectTest } {
  let registry: Registry = REGISTRY.clone();
  register(registry);

  let poison = false;

  let hooks: Options | undefined;
  let record: RecordBuilder | undefined;

  if (typeof hooksOrNested === "function") {
    nested = hooksOrNested;
  } else if (typeof hooksOrNested === "object") {
    hooks = hooksOrNested;

    if ("record" in hooksOrNested) {
      record = hooksOrNested.record;
    }
  }

  let wrappedHooks = {
    beforeEach() {
      registry = REGISTRY.clone();
      register(registry);
      if (hooks && hooks.beforeEach) {
        hooks.beforeEach();
      }
    },

    after() {
      if (hooks && hooks.afterEach) {
        hooks.afterEach();
      }

      poison = true;
    }
  };

  if (nested && !record) {
    let testOverload = test;
    let nestedOverload = nested as (test: Test) => void;

    nestedModule(nestedOverload, testOverload);
  } else if (nested && record) {
    let testOverload = subjectTest(record);
    let nestedOverload = nested as (test: RecordSubjectTest) => void;

    nestedModule(nestedOverload, testOverload);
  } else {
    QUnit.module(moduleDescription, wrappedHooks);
  }

  return {
    get registry() {
      if (poison) {
        throw new Error(
          `Can't use module "${moduleDescription}"'s state in another module`
        );
      }
      return registry;
    },

    test: record ? subjectTest(record) : test
  };

  function test(
    description: string,
    callback: (assert: typeof QUnit.assert, state: TestState) => void
  ): void {
    QUnit.test(description, assert =>
      callback(assert, {
        registry,
        validateDraft(builder, obj) {
          return validateDraft(builder, obj, registry);
        },

        validatePublished(builder, obj) {
          return validatePublished(builder, obj, registry);
        },

        validateSloppy(builder, obj) {
          return validateSloppy(builder, obj, registry);
        },

        describe(builder) {
          return describe(registry, builder);
        },

        schemaFormat(builder) {
          return schemaFormat(registry, builder);
        },

        typescript(builder, options) {
          return typescript(registry, builder, options);
        },

        graphql(builder, options) {
          return graphql(registry, builder, options);
        },

        toJSON(builder) {
          return toJSON(builder, registry);
        }
      })
    );
  }

  function subjectTest(subject: RecordBuilder): RecordSubjectTest {
    return (
      description: string,
      callback: (assert: typeof QUnit.assert, state: SubjectTestState) => void
    ) => {
      QUnit.test(description, assert =>
        callback(assert, {
          registry,
          validateDraft(obj) {
            return validateDraft(subject, obj, registry);
          },

          validatePublished(obj) {
            return validatePublished(subject, obj, registry);
          },

          validateSloppy(obj) {
            return validateSloppy(subject, obj, registry);
          },

          describe() {
            return describe(registry, subject);
          },

          schemaFormat() {
            return schemaFormat(registry, subject);
          },

          typescript(options) {
            return typescript(registry, subject, options);
          },

          graphql(options) {
            return graphql(registry, subject, options);
          },

          toJSON() {
            return toJSON(subject, registry);
          }
        })
      );
    };
  }

  function nestedModule(callback: (test: Test) => void, func: Test): void;
  function nestedModule(
    callback: (test: RecordSubjectTest) => void,
    func: RecordSubjectTest
  ): void;
  function nestedModule(nestedCallback: any, testFunction: any): void {
    QUnit.module(moduleDescription, wrappedHooks, () => {
      nestedCallback(testFunction);
    });
  }
}

export type ValidateFunction = (
  record: RecordBuilder,
  obj: Dict
) => Task<ValidationError[]>;

export type SubjectValidateFunction = (obj: Dict) => Task<ValidationError[]>;

function validate(
  record: RecordBuilder,
  obj: Dict<unknown>,
  registry: Registry
): Task<ValidationError[]> {
  return record.with({ registry }).validate(obj, ENV);
}

function validateDraft(
  record: RecordBuilder,
  obj: Dict<unknown>,
  registry: Registry
): Task<ValidationError[]> {
  return record.with({ registry, draft: true }).validate(obj, ENV);
}

function validateSloppy(
  record: RecordBuilder,
  obj: Dict<unknown>,
  registry: Registry
): Task<ValidationError[]> {
  return record
    .with({ registry, draft: true, strictKeys: false })
    .validate(obj, ENV);
}

function validatePublished(
  record: RecordBuilder,
  obj: Dict<unknown>,
  registry: Registry
): Task<ValidationError[]> {
  return validate(record, obj, registry);
}
