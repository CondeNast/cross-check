import { validate, validator } from "@cross-check/core";

QUnit.module("validator()");

QUnit.test("void options using the synchronous API", async assert => {
  let isAllCaps = validator("is-all-caps", () => (input: string) =>
    input.toUpperCase() === input
  );

  assert.deepEqual(await validate("hello", isAllCaps()), [
    {
      path: [],
      message: {
        name: "is-all-caps",
        details: null
      }
    }
  ]);

  assert.deepEqual(await validate("Hello", isAllCaps()), [
    {
      path: [],
      message: {
        name: "is-all-caps",
        details: null
      }
    }
  ]);

  assert.deepEqual(await validate("HELLO", isAllCaps()), []);
});

QUnit.test("with options using the synchronous API", async assert => {
  let lt = validator("lt", (upperBound: number) => (input: number) =>
    input < upperBound
  );

  assert.deepEqual(await validate(5, lt(5)), [
    {
      path: [],
      message: {
        name: "lt",
        details: 5
      }
    }
  ]);

  assert.deepEqual(await validate(6, lt(5)), [
    {
      path: [],
      message: {
        name: "lt",
        details: 5
      }
    }
  ]);

  assert.deepEqual(await validate(4, lt(5)), []);
});
