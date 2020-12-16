import { ValidationError, format } from "@cross-check/core";
import validates, {
  ValidationBuildable,
  ValidationBuilder,
  validators
} from "@cross-check/dsl";
import Task from "no-show";
import { Option, isIndexable } from "ts-std";
import { buildAndRun as runWithEnv, defaultRun } from "../support";

describe("Validators (array)", () => {

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

  test("array", async () => {
    let isStringArray = validators.array(validators.isString());

    expect(
      format(validates(isStringArray))
    ).toEqual(
      `(pipe (is-array) (array-items (is-string)))`
    );

    expect(await defaultRun(isStringArray, null)).toEqual([
      failure(null, "type", "array")
    ]);

    expect(await defaultRun(isStringArray, "string-is-not-arr")).toEqual([
      failure(null, "type", "array")
    ]);

    itemTests(isStringArray, Array, defaultRun);
  });

  test("custom asList", async () => {
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
    itemTests(isStringArray, arr, (validation, value) =>
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

  test("arrayItems", async () => {
    let isStringArray = validators.items(validators.isString());

    expect(format(validates(isStringArray))).toEqual(`(array-items (is-string))`);

    itemTests(isStringArray, Array, defaultRun);
  });

  async function itemTests<T>(
    builder: ValidationBuilder<T>,
    arr: (...args: Array<unknown>) => T,
    run: (b: ValidationBuildable<T>, value: T) => Task<ValidationError[]>
  ) {
    expect(await run(builder, arr())).toEqual(success());
    expect(
      await run(builder, arr(null))
    ).toEqual(
      [failure("0", "type", "string")]
    );
    expect(await run(builder, arr(""))).toEqual(success());
    expect(
      await run(builder, arr(arr("hello")))
    ).toEqual(
      [failure("0", "type", "string")]
    );
    expect(
      await run(builder, arr("", null, "item", false))
    ).toEqual(
      [failure("1", "type", "string"), failure("3", "type", "string")],
    );
  }
});