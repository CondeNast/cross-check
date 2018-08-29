import { ValidationError, format } from "@cross-check/core";
import validates, {
  ValidationBuildable,
  ValidationBuilder,
  validators
} from "@cross-check/dsl";
import Task from "no-show";
import { Option, isIndexable } from "ts-std";
import { buildAndRun as runWithEnv, defaultRun } from "../support";

QUnit.module("Validators (array)");

function success(): ValidationError[] {
  return [];
}

function failure(
  path: Option<string>,
  type: string,
  details: unknown
): ValidationError {
  return {
    path: path ? path.split(".") : [],
    message: {
      name: type,
      details
    }
  };
}

QUnit.test("array", async assert => {
  let isStringArray = validators.array(validators.isString());

  assert.equal(
    format(validates(isStringArray)),
    `(pipe (is-array) (array-items (is-string)))`
  );

  assert.deepEqual(await defaultRun(isStringArray, null), [
    failure(null, "type", "array")
  ]);

  assert.deepEqual(await defaultRun(isStringArray, "string-is-not-arr"), [
    failure(null, "type", "array")
  ]);

  itemTests(isStringArray, assert, Array, defaultRun);
});

QUnit.test("custom asList", async assert => {
  const ENV = {
    get(value: unknown, key: string): unknown {
      if (isIndexable(value)) {
        return value[key];
      } else {
        return;
      }
    },

    asList(value: unknown): Option<Iterable<unknown>> {
      if (isIndexable(value) && value.toArray) {
        return iterable(value as { toArray(): Array<unknown> });
      } else {
        return null;
      }
    }
  };

  let isStringArray = validators.array(validators.isString());
  itemTests(isStringArray, assert, arr, (validation, value) =>
    runWithEnv(validation, value, ENV)
  );

  function arr(...args: Array<unknown>): { toArray(): Array<unknown> } {
    return {
      toArray: () => args
    };
  }

  function* iterable(value: { toArray(): Array<unknown> }) {
    yield* value.toArray();
  }
});

QUnit.test("arrayItems", async assert => {
  let isStringArray = validators.items(validators.isString());

  assert.equal(format(validates(isStringArray)), `(array-items (is-string))`);

  itemTests(isStringArray, assert, Array, defaultRun);
});

async function itemTests<T>(
  builder: ValidationBuilder<T>,
  assert: typeof QUnit.assert,
  arr: (...args: Array<unknown>) => T,
  run: (b: ValidationBuildable<T>, value: T) => Task<ValidationError[]>
) {
  assert.deepEqual(await run(builder, arr()), success(), "empty");
  assert.deepEqual(
    await run(builder, arr(null)),
    [failure("0", "type", "string")],
    "[null]"
  );
  assert.deepEqual(await run(builder, arr("")), success(), `[""]`);
  assert.deepEqual(
    await run(builder, arr(arr("hello"))),
    [failure("0", "type", "string")],
    `[["hello"]]`
  );
  assert.deepEqual(
    await run(builder, arr("", null, "item", false)),
    [failure("1", "type", "string"), failure("3", "type", "string")],
    `["", null, "item", false]`
  );
}
