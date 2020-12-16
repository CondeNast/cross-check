import { ValidationError, format } from "@cross-check/core";
import validates, { validators } from "@cross-check/dsl";
import { buildAndRun as run } from "../support";

describe("Validators (nullable)", () => {

  function success(): ValidationError[] {
    return [];
  }

  function failure(type: string): ValidationError[] {
    return [
      {
        path: [],
        message: {
          name: "type",
          details: type
        }
      }
    ];
  }

  test("nullable", async () => {
    let nullableString = validators.nullable(validators.isString());

    expect(
      format(validates(nullableString))).toEqual(
        `(try do=(any (is-null) (is-string)) catch=function() { ... })`
      );

    expect(
      await run(validators.nullable(validators.isString()), "hello")).toEqual(
        success()
      );
    expect(
      await run(validators.nullable(validators.isString()), null)).toEqual(
        success()
      );

    expect(
      await run(validators.nullable(validators.isString()), undefined)).toEqual(
        failure("string")
      );
    expect(
      await run(validators.nullable(validators.isString()), 123)).toEqual(
        failure("string")
      );
  });

  test("maybe", async () => {
    let maybeString = validators.maybe(validators.isString());

    expect(
      format(validates(maybeString))).toEqual(
        `(try do=(any (is-absent) (is-string)) catch=function() { ... })`
      );

    expect(
      await run(validators.maybe(validators.isString()), "hello")).toEqual(
        success()
      );
    expect(
      await run(validators.maybe(validators.isString()), null)).toEqual(
        success()
      );
    expect(
      await run(validators.maybe(validators.isString()), undefined)).toEqual(
        success()
      );

    expect(
      await run(validators.maybe(validators.isString()), 123)).toEqual(
        failure("string")
      );
  });
});