import { ValidationError, format } from "@cross-check/core";
import validates, { validators } from "@cross-check/dsl";
import { buildAndRun as run } from "../support";

QUnit.module("Validators (nullable)");

function success(): ValidationError[] {
  return [];
}

function failure(type: string): ValidationError[] {
  return [
    {
      path: [],
      message: {
        key: "type",
        args: type
      }
    }
  ];
}

QUnit.test("nullable", async assert => {
  let nullableString = validators.nullable(validators.isString());

  assert.equal(
    format(validates(nullableString)),
    `(try do=(any (is-null) (is-string)) catch=function() { ... })`
  );

  assert.deepEqual(
    await run(validators.nullable(validators.isString()), "hello"),
    success()
  );
  assert.deepEqual(
    await run(validators.nullable(validators.isString()), null),
    success()
  );

  assert.deepEqual(
    await run(validators.nullable(validators.isString()), undefined),
    failure("string")
  );
  assert.deepEqual(
    await run(validators.nullable(validators.isString()), 123),
    failure("string")
  );
});

QUnit.test("maybe", async assert => {
  let maybeString = validators.maybe(validators.isString());

  assert.equal(
    format(validates(maybeString)),
    `(try do=(any (is-absent) (is-string)) catch=function() { ... })`
  );

  assert.deepEqual(
    await run(validators.maybe(validators.isString()), "hello"),
    success()
  );
  assert.deepEqual(
    await run(validators.maybe(validators.isString()), null),
    success()
  );
  assert.deepEqual(
    await run(validators.maybe(validators.isString()), undefined),
    success()
  );

  assert.deepEqual(
    await run(validators.maybe(validators.isString()), 123),
    failure("string")
  );
});
