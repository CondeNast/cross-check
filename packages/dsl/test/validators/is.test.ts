import { ValidationError, format } from "@cross-check/core";
import validates, { validators } from "@cross-check/dsl";
import { buildAndRun as run } from "../support";

describe("Validators (is)", () => {
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

  test("isAbsent", async () => {
    expect(format(validates(validators.isAbsent()))).toEqual(`(is-absent)`);

    expect(
      await run(validators.isAbsent(), "hello")).toEqual(
      failure("absent")
    );
    expect(await run(validators.isAbsent(), "")).toEqual( failure("absent"));
    expect(await run(validators.isAbsent(), [])).toEqual( failure("absent"));
    expect(await run(validators.isAbsent(), false)).toEqual( failure("absent"));
    expect(await run(validators.isAbsent(), NaN)).toEqual( failure("absent"));

    expect(await run(validators.isAbsent(), null)).toEqual( success());
    expect(await run(validators.isAbsent(), undefined)).toEqual( success());
  });

  test("isPresent", async () => {
    expect(format(validates(validators.isPresent()))).toEqual( `(is-present)`);

    expect(await run(validators.isPresent(), "hello")).toEqual( success());
    expect(await run(validators.isPresent(), "")).toEqual( success());
    expect(await run(validators.isPresent(), [])).toEqual( success());
    expect(await run(validators.isPresent(), false)).toEqual( success());
    expect(await run(validators.isPresent(), NaN)).toEqual( success());

    expect(await run(validators.isPresent(), null)).toEqual(failure("present"));
    expect(
      await run(validators.isPresent(), undefined)).toEqual(
      failure("present")
    );
  });

  test("isNull", async () => {
    expect(format(validates(validators.isNull()))).toEqual(`(is-null)`);

    expect(await run(validators.isNull(), "hello")).toEqual(failure("null"));
    expect(await run(validators.isNull(), "")).toEqual(failure("null"));
    expect(await run(validators.isNull(), [])).toEqual(failure("null"));
    expect(await run(validators.isNull(), false)).toEqual(failure("null"));
    expect(await run(validators.isNull(), NaN)).toEqual(failure("null"));
    expect(await run(validators.isNull(), undefined)).toEqual(failure("null"));

    expect(await run(validators.isNull(), null)).toEqual(success());
  });

  test("isNotNull", async () => {
    expect(format(validates(validators.isNotNull()))).toEqual(`(is-not-null)`);

    expect(await run(validators.isNotNull(), "hello")).toEqual( success());
    expect(await run(validators.isNotNull(), "")).toEqual(success());
    expect(await run(validators.isNotNull(), [])).toEqual( success());
    expect(await run(validators.isNotNull(), false)).toEqual( success());
    expect(await run(validators.isNotNull(), NaN)).toEqual( success());
    expect(await run(validators.isNotNull(), undefined)).toEqual(success());

    expect(
      await run(validators.isNotNull(), null)).toEqual(
      failure("not-null")
    );
  });

  test("isUndefined", async () => {
    expect(format(validates(validators.isUndefined()))).toEqual( `(is-undefined)`);

    expect(
      await run(validators.isUndefined(), "hello")).toEqual(
      failure("undefined")
    );
    expect(
      await run(validators.isUndefined(), "")).toEqual(
      failure("undefined")
    );
    expect(
      await run(validators.isUndefined(), [])).toEqual(
      failure("undefined")
    );
    expect(
      await run(validators.isUndefined(), false)).toEqual(
      failure("undefined")
    );
    expect(
      await run(validators.isUndefined(), NaN)).toEqual(
      failure("undefined")
    );
    expect(
      await run(validators.isUndefined(), null)).toEqual(
      failure("undefined")
    );

    expect(await run(validators.isUndefined(), undefined)).toEqual( success());
  });

  test("isNotUndefined", async () => {
    expect(
      format(validates(validators.isNotUndefined()))).toEqual(
      `(is-not-undefined)`
    );

    expect(await run(validators.isNotUndefined(), "hello")).toEqual( success());
    expect(await run(validators.isNotUndefined(), "")).toEqual( success());
    expect(await run(validators.isNotUndefined(), [])).toEqual( success());
    expect(await run(validators.isNotUndefined(), false)).toEqual( success());
    expect(await run(validators.isNotUndefined(), NaN)).toEqual( success());
    expect(await run(validators.isNotUndefined(), null)).toEqual(success());

    expect(
      await run(validators.isNotUndefined(), undefined)).toEqual(
      failure("not-undefined")
    );
  });

  test("isNumber", async () => {
    expect(format(validates(validators.isNumber()))).toEqual(`(is-number)`);

    expect(await run(validators.isNumber(), 5)).toEqual( success());
    expect(await run(validators.isNumber(), 3.14)).toEqual( success());
    expect(await run(validators.isNumber(), NaN)).toEqual( success());

    expect(await run(validators.isNumber(), null)).toEqual( failure("number"));
    expect(
      await run(validators.isNumber(), undefined)).toEqual(
      failure("number")
    );
    expect(await run(validators.isNumber(), "5")).toEqual(failure("number"));
  });

  test("isBoolean", async () => {
    expect(format(validates(validators.isBoolean()))).toEqual(`(is-boolean)`);

    expect(await run(validators.isBoolean(), true)).toEqual(success());
    expect(await run(validators.isBoolean(), false)).toEqual( success());

    expect(await run(validators.isBoolean(), null)).toEqual(failure("boolean"));
    expect(
      await run(validators.isBoolean(), undefined)).toEqual(
      failure("boolean")
    );
    expect(
      await run(validators.isBoolean(), "true")).toEqual(
      failure("boolean")
    );
  });

  test("isString", async () => {
    expect(format(validates(validators.isString()))).toEqual(`(is-string)`);

    expect(await run(validators.isString(), "hello")).toEqual( success());
    expect(await run(validators.isString(), "")).toEqual(success());

    expect(await run(validators.isString(), null)).toEqual(failure("string"));
    expect(
      await run(validators.isString(), undefined)).toEqual(
      failure("string")
    );
    expect(
      // tslint:disable-next-line:no-construct
      await run(validators.isString(), new String("hello"))).toEqual(
      failure("string")
    );
  });

  test("isSymbol", async () => {
    expect(format(validates(validators.isSymbol()))).toEqual(`(is-symbol)`);

    expect(
      await run(validators.isSymbol(), Symbol("hello"))).toEqual(
      success()
    );
    expect(await run(validators.isSymbol(), Symbol(123))).toEqual(success());
    expect(await run(validators.isSymbol(), Symbol())).toEqual(success());

    expect(await run(validators.isSymbol(), null)).toEqual(failure("symbol"));
    expect(
      await run(validators.isSymbol(), undefined)).toEqual(
      failure("symbol")
    );
    expect(
      await run(validators.isSymbol(), "hello")).toEqual(
      failure("symbol")
    );
  });

  test("isFunction", async () => {
    expect(format(validates(validators.isFunction()))).toEqual( `(is-function)`);

    expect(
      // tslint:disable-next-line:only-arrow-functions
      await run(validators.isFunction(), function () {
        /**/
      })).toEqual(
      success()
    );
    expect(
      await run(validators.isFunction(), () => {
        /**/
      })).toEqual(
      success()
    );
    expect(
      await run(validators.isFunction(), new Function())).toEqual(
      success()
    );

    expect(
      await run(validators.isFunction(), null)).toEqual(
      failure("function")
    );
    expect(
      await run(validators.isFunction(), undefined)).toEqual(
      failure("function")
    );
    expect(
      await run(validators.isFunction(), "hello")).toEqual(
      failure("function")
    );
  });

  test("isIndexable", async () => {
    expect(format(validates(validators.isIndexable()))).toEqual( `(is-indexable)`);

    expect(await run(validators.isIndexable(), [])).toEqual( success());
    expect(await run(validators.isIndexable(), {})).toEqual( success());
    expect(
      await run(validators.isIndexable(), new class { }())).toEqual(
      success()
    );
    expect(await run(validators.isIndexable(), new Date())).toEqual( success());
    expect(
      // tslint:disable-next-line:no-construct
      await run(validators.isIndexable(), new String())).toEqual(
      success()
    );
    expect(
      await run(validators.isIndexable(), () => {
        /**/
      })).toEqual(
      success()
    );
    expect(
      await run(validators.isIndexable(), new Function())).toEqual(
      success()
    );

    expect(
      await run(validators.isIndexable(), null)).toEqual(
      failure("indexable")
    );
    expect(
      await run(validators.isIndexable(), undefined)).toEqual(
      failure("indexable")
    );
    expect(
      await run(validators.isIndexable(), "hello")).toEqual(
      failure("indexable")
    );
  });

  test("isObject", async () => {
    expect(format(validates(validators.isObject()))).toEqual(`(is-object)`);

    expect(await run(validators.isObject(), [])).toEqual(failure("object"));
    expect(await run(validators.isObject(), {})).toEqual(success());
    expect(await run(validators.isObject(), new class { }())).toEqual(success());
    expect(await run(validators.isObject(), new Date())).toEqual(success());
    // tslint:disable-next-line:no-construct
    expect(await run(validators.isObject(), new String())).toEqual( success());

    expect(await run(validators.isObject(), null)).toEqual( failure("object"));
    expect(
      await run(validators.isObject(), undefined)).toEqual(
      failure("object")
    );
    expect(
      await run(validators.isObject(), "hello")).toEqual(
      failure("object")
    );
    expect(
      await run(validators.isObject(), () => {
        /**/
      })).toEqual(
      failure("object")
    );
    expect(
      await run(validators.isObject(), new Function())).toEqual(
      failure("object")
    );
  });

  test("isArray", async () => {
    expect(format(validates(validators.isArray()))).toEqual( `(is-array)`);

    expect(await run(validators.isArray(), [])).toEqual( success());
    expect(await run(validators.isArray(), [1, 2, 3])).toEqual( success());
    expect(await run(validators.isArray(), new Array())).toEqual( success());

    expect(await run(validators.isArray(), null)).toEqual(failure("array"));
    expect(
      await run(validators.isArray(), undefined)).toEqual(
      failure("array")
    );
    expect(await run(validators.isArray(), "hello")).toEqual( failure("array"));
  });
});
