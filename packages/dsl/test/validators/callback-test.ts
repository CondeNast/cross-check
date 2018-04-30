import { ErrorMessage, ValidationError, format } from "@cross-check/core";
import validates from "@cross-check/dsl";
import { buildAndRun as run } from "../support";

QUnit.module("Validators (callback)");

QUnit.test("isAlphaNumeric", async assert => {
  function isAlphaNumeric(str: string): ErrorMessage | void {
    if (!str.match(/^[a-z0-9]+$/i)) {
      return { name: "alpha-numeric", details: undefined };
    }
  }

  function success(): ValidationError[] {
    return [];
  }

  function failure(): ValidationError[] {
    return [
      {
        path: [],
        message: {
          name: "alpha-numeric",
          details: undefined
        }
      }
    ];
  }

  assert.equal(
    format(validates(isAlphaNumeric, "is-alpha-numeric")),
    `(is-alpha-numeric function() { ... })`
  );

  assert.deepEqual(await run(isAlphaNumeric, "hello"), success());
  assert.deepEqual(await run(isAlphaNumeric, "1337"), success());
  assert.deepEqual(await run(isAlphaNumeric, "C0DE"), success());

  assert.deepEqual(await run(isAlphaNumeric, ""), failure());
  assert.deepEqual(await run(isAlphaNumeric, "hello-world"), failure());
  assert.deepEqual(await run(isAlphaNumeric, "._."), failure());
});
