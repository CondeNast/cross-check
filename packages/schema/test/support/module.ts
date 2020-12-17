import { ValidationError } from "@cross-check/core";
import {
  EnvFormatters,
  EnvRecordFormatters,
  Environment,
  FormattableRecord,
  REGISTRY,
  RecordBuilder,
  Registry
} from "@cross-check/schema";
import Task from "no-show";
import { resolve } from "./records";
import { ENV } from "./utils";

export type StringFormatFunction<O = void> = O extends void
  ? ((record: FormattableRecord) => string)
  : ((record: FormattableRecord, options: O) => string);
export type SubjectStringFormatFunction<O = void> = O extends void
  ? (() => string)
  : ((options: O) => string);

export type RecursiveFormatFunction<T> = (record: FormattableRecord) => T;
export type SubjectRecursiveFormatFunction<T> = () => T;

export type Validate = (name: string, value: { [key: string]: unknown }) => Task<ValidationError[]>;
export type SubjectValidate = (value: { [key: string]: unknown }) => Task<ValidationError[]>;

export interface TestEnv {
  published: Environment;
  draft: Environment;
  sloppy: Environment;
}

export interface TestEnvFormatters {
  published: EnvFormatters;
  draft: EnvFormatters;
  sloppy: EnvFormatters;
}

export interface TestEnvValidate {
  published: Validate;
  draft: Validate;
  sloppy: Validate;
}

export interface SubjectTestEnvFormatters {
  published: EnvRecordFormatters;
  draft: EnvRecordFormatters;
  sloppy: EnvRecordFormatters;
}

export interface SubjectTestEnvValidate {
  published: SubjectValidate;
  draft: SubjectValidate;
  sloppy: SubjectValidate;
}

export interface TestState {
  registry: Registry;
  validate: TestEnvValidate;
  env: TestEnv;
  format: TestEnvFormatters;
}

export interface SubjectTestState {
  registry: Registry;
  validate: SubjectTestEnvValidate;
  env: TestEnv;
  format: SubjectTestEnvFormatters;
}

export interface Options {
  beforeEach?: () => void;
  afterEach?: () => void;
}

export interface RecordSubjectOptions extends Options {
  record: RecordBuilder;
}

let ctx: {
  used: boolean,
  registry: Registry
};

export function subject(builder?: RecordBuilder) {
  if (ctx.used) {
    throw new Error(
      `Can't reuse state in across tests`
    );
  }
  let registry = ctx.registry;
  let draft = new Environment(registry, { registry, draft: true }, ENV);
  let published = new Environment(registry, { registry }, ENV);
  let sloppy = new Environment(
    registry,
    { registry, draft: true, strictKeys: false },
    ENV
  );

  if (builder) {
    return {
      registry,

      validate: {
        draft: draft.validator(builder.name),
        published: published.validator(builder.name),
        sloppy: sloppy.validator(builder.name)
      },

      env: {
        draft,
        published,
        sloppy
      },

      format: {
        draft: draft.format(builder.name),
        published: published.format(builder.name),
        sloppy: sloppy.format(builder.name)
      }
    };
  }

  return {
    registry,

    validate: {
      draft: draft.validation,
      published: published.validation,
      sloppy: sloppy.validation
    },

    env: {
      draft,
      published,
      sloppy
    },

    format: {
      draft: draft.formatters,
      published: published.formatters,
      sloppy: sloppy.formatters
    }
  };
}

export function setupSchemaTest() {
  ctx = {
    used: false,
    registry: REGISTRY.clone({
      record: resolve
    })
  };
}

export function teardownSchemaTest() {
  ctx.used = true;
}
