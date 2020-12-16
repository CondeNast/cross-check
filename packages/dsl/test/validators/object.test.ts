import { ValidationError, format } from "@cross-check/core";
import validates, { ValidationBuilder, validators } from "@cross-check/dsl";
import { buildAndRun as run } from "../support";
import { keysError } from "../utils";

describe("Validators (object)", () => {
  function success(): ValidationError[] {
    return [];
  }

  function failure(
    path: string | null,
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

  test("object should fail if passed non-objects", async () => {
    let nullableString = validators.nullable(validators.object({}));

    expect(
      format(validates(nullableString))).toEqual(
      `(try do=(any (is-null) (pipe (is-object) (fields {}))) catch=function() { ... })`
    );

    expect(await run(validators.object({}), null)).toEqual( [
      failure(null, "type", "object")
    ]);
    expect(await run(validators.object({}), "string-is-not-arr")).toEqual( [
      failure(null, "type", "object")
    ]);
  });

  type ObjectBuilder = (
    fields: Record<string, ValidationBuilder<any>>
  ) => ValidationBuilder<any>;

  [validators.fields, validators.object].forEach((builder: ObjectBuilder) => {
    let name = builder.name;

    test(`simple ${name}`, async () => {
      const geo = builder({
        lat: validators.isNumber(),
        long: validators.isNumber()
      });

      if (builder === validators.fields) {
        expect(
          format(validates(geo))).toEqual(
          `(fields lat=(is-number) long=(is-number))`
        );
      } else {
        expect(
          format(validates(geo))).toEqual(
          `(pipe (is-object) (fields lat=(is-number) long=(is-number)))`
        );
      }

      expect(await run(geo, { lat: 0, long: 0 })).toEqual( success());
      expect(await run(geo, { lat: 0, long: null })).toEqual( [
        failure("long", "type", "number")
      ]);
      expect(await run(geo, { lat: 0, long: [0] })).toEqual([
        failure("long", "type", "number")
      ]);

      expect(await run(geo, { lat: null, long: null })).toEqual([
        failure("lat", "type", "number"),
        failure("long", "type", "number")
      ]);
    });

    test(`nested ${name}`, async () => {
      const feature = builder({
        article: builder({
          contact: builder({
            geo: builder({
              lat: validators.isNumber(),
              long: validators.isNumber()
            })
          })
        })
      });

      function wrap(inner: any) {
        return { article: { contact: { geo: inner } } };
      }

      expect(await run(feature, wrap({ lat: 0, long: 0 }))).toEqual( success());
      expect(await run(feature, wrap({ lat: 0, long: null }))).toEqual( [
        failure("article.contact.geo.long", "type", "number")
      ]);
      expect(await run(feature, wrap({ lat: 0, long: [0] }))).toEqual( [
        failure("article.contact.geo.long", "type", "number")
      ]);

      expect(await run(feature, wrap({ lat: null, long: null }))).toEqual( [
        failure("article.contact.geo.lat", "type", "number"),
        failure("article.contact.geo.long", "type", "number")
      ]);
    });
  });

  test(`simple ${validators.strictObject.name}`, async () => {
    const geo = validators.strictObject({
      lat: validators.isNumber(),
      long: validators.isNumber()
    });

    expect(
      format(validates(geo))).toEqual(
      `(pipe (is-object) (keys "lat" "long") (fields lat=(is-number) long=(is-number)))`
    );

    expect(await run(geo, { lat: 0, long: 0 })).toEqual(success());

    expect(await run(geo, { lat: 0 })).toEqual( [
      keysError({ missing: ["long"] })
    ]);

    expect(await run(geo, { lat: 0, long: 0, extraData: 1 })).toEqual( [
      keysError({ extra: ["extraData"] })
    ]);

    expect(await run(geo, { lat: 0, extraData: 1 })).toEqual( [
      keysError({ missing: ["long"], extra: ["extraData"] })
    ]);
  });
});
