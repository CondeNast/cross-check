import { ValidationError, format } from "@cross-check/core";
import validates, { validators } from "@cross-check/dsl";
import { buildAndRun as run } from "../support";

QUnit.module("Validators (is)");

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

QUnit.test("isAbsent", async assert => {
  assert.equal(format(validates(validators.isAbsent())), `(is-absent)`);

  assert.deepEqual(
    await run(validators.isAbsent(), "hello"),
    failure("absent")
  );
  assert.deepEqual(await run(validators.isAbsent(), ""), failure("absent"));
  assert.deepEqual(await run(validators.isAbsent(), []), failure("absent"));
  assert.deepEqual(await run(validators.isAbsent(), false), failure("absent"));
  assert.deepEqual(await run(validators.isAbsent(), NaN), failure("absent"));

  assert.deepEqual(await run(validators.isAbsent(), null), success());
  assert.deepEqual(await run(validators.isAbsent(), undefined), success());
});

QUnit.test("isPresent", async assert => {
  assert.equal(format(validates(validators.isPresent())), `(is-present)`);

  assert.deepEqual(await run(validators.isPresent(), "hello"), success());
  assert.deepEqual(await run(validators.isPresent(), ""), success());
  assert.deepEqual(await run(validators.isPresent(), []), success());
  assert.deepEqual(await run(validators.isPresent(), false), success());
  assert.deepEqual(await run(validators.isPresent(), NaN), success());

  assert.deepEqual(await run(validators.isPresent(), null), failure("present"));
  assert.deepEqual(
    await run(validators.isPresent(), undefined),
    failure("present")
  );
});

QUnit.test("isNull", async assert => {
  assert.equal(format(validates(validators.isNull())), `(is-null)`);

  assert.deepEqual(await run(validators.isNull(), "hello"), failure("null"));
  assert.deepEqual(await run(validators.isNull(), ""), failure("null"));
  assert.deepEqual(await run(validators.isNull(), []), failure("null"));
  assert.deepEqual(await run(validators.isNull(), false), failure("null"));
  assert.deepEqual(await run(validators.isNull(), NaN), failure("null"));
  assert.deepEqual(await run(validators.isNull(), undefined), failure("null"));

  assert.deepEqual(await run(validators.isNull(), null), success());
});

QUnit.test("isNotNull", async assert => {
  assert.equal(format(validates(validators.isNotNull())), `(is-not-null)`);

  assert.deepEqual(await run(validators.isNotNull(), "hello"), success());
  assert.deepEqual(await run(validators.isNotNull(), ""), success());
  assert.deepEqual(await run(validators.isNotNull(), []), success());
  assert.deepEqual(await run(validators.isNotNull(), false), success());
  assert.deepEqual(await run(validators.isNotNull(), NaN), success());
  assert.deepEqual(await run(validators.isNotNull(), undefined), success());

  assert.deepEqual(
    await run(validators.isNotNull(), null),
    failure("not-null")
  );
});

QUnit.test("isUndefined", async assert => {
  assert.equal(format(validates(validators.isUndefined())), `(is-undefined)`);

  assert.deepEqual(
    await run(validators.isUndefined(), "hello"),
    failure("undefined")
  );
  assert.deepEqual(
    await run(validators.isUndefined(), ""),
    failure("undefined")
  );
  assert.deepEqual(
    await run(validators.isUndefined(), []),
    failure("undefined")
  );
  assert.deepEqual(
    await run(validators.isUndefined(), false),
    failure("undefined")
  );
  assert.deepEqual(
    await run(validators.isUndefined(), NaN),
    failure("undefined")
  );
  assert.deepEqual(
    await run(validators.isUndefined(), null),
    failure("undefined")
  );

  assert.deepEqual(await run(validators.isUndefined(), undefined), success());
});

QUnit.test("isNotUndefined", async assert => {
  assert.equal(
    format(validates(validators.isNotUndefined())),
    `(is-not-undefined)`
  );

  assert.deepEqual(await run(validators.isNotUndefined(), "hello"), success());
  assert.deepEqual(await run(validators.isNotUndefined(), ""), success());
  assert.deepEqual(await run(validators.isNotUndefined(), []), success());
  assert.deepEqual(await run(validators.isNotUndefined(), false), success());
  assert.deepEqual(await run(validators.isNotUndefined(), NaN), success());
  assert.deepEqual(await run(validators.isNotUndefined(), null), success());

  assert.deepEqual(
    await run(validators.isNotUndefined(), undefined),
    failure("not-undefined")
  );
});

QUnit.test("isNumber", async assert => {
  assert.equal(format(validates(validators.isNumber())), `(is-number)`);

  assert.deepEqual(await run(validators.isNumber(), 5), success());
  assert.deepEqual(await run(validators.isNumber(), 3.14), success());
  assert.deepEqual(await run(validators.isNumber(), NaN), success());

  assert.deepEqual(await run(validators.isNumber(), null), failure("number"));
  assert.deepEqual(
    await run(validators.isNumber(), undefined),
    failure("number")
  );
  assert.deepEqual(await run(validators.isNumber(), "5"), failure("number"));
});

QUnit.test("isBoolean", async assert => {
  assert.equal(format(validates(validators.isBoolean())), `(is-boolean)`);

  assert.deepEqual(await run(validators.isBoolean(), true), success());
  assert.deepEqual(await run(validators.isBoolean(), false), success());

  assert.deepEqual(await run(validators.isBoolean(), null), failure("boolean"));
  assert.deepEqual(
    await run(validators.isBoolean(), undefined),
    failure("boolean")
  );
  assert.deepEqual(
    await run(validators.isBoolean(), "true"),
    failure("boolean")
  );
});

QUnit.test("isString", async assert => {
  assert.equal(format(validates(validators.isString())), `(is-string)`);

  assert.deepEqual(await run(validators.isString(), "hello"), success());
  assert.deepEqual(await run(validators.isString(), ""), success());

  assert.deepEqual(await run(validators.isString(), null), failure("string"));
  assert.deepEqual(
    await run(validators.isString(), undefined),
    failure("string")
  );
  assert.deepEqual(
    // tslint:disable-next-line:no-construct
    await run(validators.isString(), new String("hello")),
    failure("string")
  );
});

QUnit.test("isSymbol", async assert => {
  assert.equal(format(validates(validators.isSymbol())), `(is-symbol)`);

  assert.deepEqual(
    await run(validators.isSymbol(), Symbol("hello")),
    success()
  );
  assert.deepEqual(await run(validators.isSymbol(), Symbol(123)), success());
  assert.deepEqual(await run(validators.isSymbol(), Symbol()), success());

  assert.deepEqual(await run(validators.isSymbol(), null), failure("symbol"));
  assert.deepEqual(
    await run(validators.isSymbol(), undefined),
    failure("symbol")
  );
  assert.deepEqual(
    await run(validators.isSymbol(), "hello"),
    failure("symbol")
  );
});

QUnit.test("isFunction", async assert => {
  assert.equal(format(validates(validators.isFunction())), `(is-function)`);

  assert.deepEqual(
    // tslint:disable-next-line:only-arrow-functions
    await run(validators.isFunction(), function() {
      /**/
    }),
    success()
  );
  assert.deepEqual(
    await run(validators.isFunction(), () => {
      /**/
    }),
    success()
  );
  assert.deepEqual(
    await run(validators.isFunction(), new Function()),
    success()
  );

  assert.deepEqual(
    await run(validators.isFunction(), null),
    failure("function")
  );
  assert.deepEqual(
    await run(validators.isFunction(), undefined),
    failure("function")
  );
  assert.deepEqual(
    await run(validators.isFunction(), "hello"),
    failure("function")
  );
});

QUnit.test("isIndexable", async assert => {
  assert.equal(format(validates(validators.isIndexable())), `(is-indexable)`);

  assert.deepEqual(await run(validators.isIndexable(), []), success());
  assert.deepEqual(await run(validators.isIndexable(), {}), success());
  assert.deepEqual(
    await run(validators.isIndexable(), new class {}()),
    success()
  );
  assert.deepEqual(await run(validators.isIndexable(), new Date()), success());
  assert.deepEqual(
    // tslint:disable-next-line:no-construct
    await run(validators.isIndexable(), new String()),
    success()
  );
  assert.deepEqual(
    await run(validators.isIndexable(), () => {
      /**/
    }),
    success()
  );
  assert.deepEqual(
    await run(validators.isIndexable(), new Function()),
    success()
  );

  assert.deepEqual(
    await run(validators.isIndexable(), null),
    failure("indexable")
  );
  assert.deepEqual(
    await run(validators.isIndexable(), undefined),
    failure("indexable")
  );
  assert.deepEqual(
    await run(validators.isIndexable(), "hello"),
    failure("indexable")
  );
});

QUnit.test("isObject", async assert => {
  assert.equal(format(validates(validators.isObject())), `(is-object)`);

  assert.deepEqual(await run(validators.isObject(), []), failure("object"));
  assert.deepEqual(await run(validators.isObject(), {}), success());
  assert.deepEqual(await run(validators.isObject(), new class {}()), success());
  assert.deepEqual(await run(validators.isObject(), new Date()), success());
  // tslint:disable-next-line:no-construct
  assert.deepEqual(await run(validators.isObject(), new String()), success());

  assert.deepEqual(await run(validators.isObject(), null), failure("object"));
  assert.deepEqual(
    await run(validators.isObject(), undefined),
    failure("object")
  );
  assert.deepEqual(
    await run(validators.isObject(), "hello"),
    failure("object")
  );
  assert.deepEqual(
    await run(validators.isObject(), () => {
      /**/
    }),
    failure("object")
  );
  assert.deepEqual(
    await run(validators.isObject(), new Function()),
    failure("object")
  );
});

QUnit.test("isArray", async assert => {
  assert.equal(format(validates(validators.isArray())), `(is-array)`);

  assert.deepEqual(await run(validators.isArray(), []), success());
  assert.deepEqual(await run(validators.isArray(), [1, 2, 3]), success());
  assert.deepEqual(await run(validators.isArray(), new Array()), success());

  assert.deepEqual(await run(validators.isArray(), null), failure("array"));
  assert.deepEqual(
    await run(validators.isArray(), undefined),
    failure("array")
  );
  assert.deepEqual(await run(validators.isArray(), "hello"), failure("array"));
});

QUnit.test("isISODateString", async assert => {
  assert.equal(format(validates(validators.isISODateString())), `(is-ISODateString)`);

  assert.deepEqual(await run(validators.isISODateString(), undefined), success());
  assert.deepEqual(await run(validators.isISODateString(), new Date().toISOString()), success());

  assert.deepEqual(await run(validators.isISODateString(), null), failure("ISODateString"));
  assert.deepEqual(await run(validators.isISODateString(), "hello"), failure("ISODateString"));
});
