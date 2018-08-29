import { ValidationError } from "@cross-check/core";
import {
  FormattableRecord,
  REGISTRY,
  RecordBuilder,
  Registry,
  Std,
  StdFormatters,
  StdRecordFormatters
} from "@cross-check/schema";
import Task from "no-show";
import { Dict } from "ts-std";
import { resolve } from "./records";
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

export type Validate = (name: string, value: Dict) => Task<ValidationError[]>;
export type SubjectValidate = (value: Dict) => Task<ValidationError[]>;

export interface TestStd {
  published: Std;
  draft: Std;
  sloppy: Std;
}

export interface TestStdFormatters {
  published: StdFormatters;
  draft: StdFormatters;
  sloppy: StdFormatters;
}

export interface TestStdValidate {
  published: Validate;
  draft: Validate;
  sloppy: Validate;
}

export interface SubjectTestStdFormatters {
  published: StdRecordFormatters;
  draft: StdRecordFormatters;
  sloppy: StdRecordFormatters;
}

export interface SubjectTestStdValidate {
  published: SubjectValidate;
  draft: SubjectValidate;
  sloppy: SubjectValidate;
}

export interface TestState {
  registry: Registry;
  validate: TestStdValidate;
  std: TestStd;
  format: TestStdFormatters;
}

export interface SubjectTestState {
  registry: Registry;
  validate: SubjectTestStdValidate;
  std: TestStd;
  format: SubjectTestStdFormatters;
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
  let registry: Registry = REGISTRY.clone({
    record: resolve
  });

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
      registry = REGISTRY.clone({
        record: resolve
      });

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
    let draft = new Std(registry, { registry, draft: true }, ENV);
    let published = new Std(registry, { registry }, ENV);
    let sloppy = new Std(
      registry,
      { registry, draft: true, strictKeys: false },
      ENV
    );

    QUnit.test(description, assert =>
      callback(assert, {
        registry,

        validate: {
          draft: draft.validation,
          published: published.validation,
          sloppy: sloppy.validation
        },

        std: {
          draft,
          published,
          sloppy
        },

        format: {
          draft: draft.formatters,
          published: published.formatters,
          sloppy: sloppy.formatters
        }
      })
    );
  }

  function subjectTest(subject: RecordBuilder): RecordSubjectTest {
    return (
      description: string,
      callback: (assert: typeof QUnit.assert, state: SubjectTestState) => void
    ) => {
      let draft = new Std(registry, { registry, draft: true }, ENV);
      let published = new Std(registry, { registry }, ENV);
      let sloppy = new Std(
        registry,
        { registry, draft: true, strictKeys: false },
        ENV
      );

      QUnit.test(description, assert =>
        callback(assert, {
          registry,

          validate: {
            draft: draft.validator(subject.name),
            published: published.validator(subject.name),
            sloppy: sloppy.validator(subject.name)
          },

          std: {
            draft,
            published,
            sloppy
          },

          format: {
            draft: draft.format(subject.name),
            published: published.format(subject.name),
            sloppy: sloppy.format(subject.name)
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
