import { ValidationError, format } from "@cross-check/core";
import validates, { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option } from "ts-std";
import { buildAndRun as run } from "../support";
import { keysError } from "../utils";

QUnit.module("Validators (object)");

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

QUnit.test("object should fail if passed non-objects", async assert => {
  let nullableString = validators.nullable(validators.object({}));

  assert.equal(
    format(validates(nullableString)),
    `(try do=(any (is-null) (pipe (is-object) (fields {}))) catch=function() { ... })`
  );

  assert.deepEqual(await run(validators.object({}), null), [
    failure(null, "type", "object")
  ]);
  assert.deepEqual(await run(validators.object({}), "string-is-not-arr"), [
    failure(null, "type", "object")
  ]);
});

type ObjectBuilder = (
  fields: Dict<ValidationBuilder<any>>
) => ValidationBuilder<any>;

[validators.fields, validators.object].forEach((builder: ObjectBuilder) => {
  let name = builder.name;

  QUnit.test(`simple ${name}`, async assert => {
    const geo = builder({
      lat: validators.isNumber(),
      long: validators.isNumber()
    });

    if (builder === validators.fields) {
      assert.equal(
        format(validates(geo)),
        `(fields lat=(is-number) long=(is-number))`
      );
    } else {
      assert.equal(
        format(validates(geo)),
        `(pipe (is-object) (fields lat=(is-number) long=(is-number)))`
      );
    }

    assert.deepEqual(await run(geo, { lat: 0, long: 0 }), success());
    assert.deepEqual(await run(geo, { lat: 0, long: null }), [
      failure("long", "type", "number")
    ]);
    assert.deepEqual(await run(geo, { lat: 0, long: [0] }), [
      failure("long", "type", "number")
    ]);

    assert.deepEqual(await run(geo, { lat: null, long: null }), [
      failure("lat", "type", "number"),
      failure("long", "type", "number")
    ]);
  });

  QUnit.test(`nested ${name}`, async assert => {
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

    assert.deepEqual(await run(feature, wrap({ lat: 0, long: 0 })), success());
    assert.deepEqual(await run(feature, wrap({ lat: 0, long: null })), [
      failure("article.contact.geo.long", "type", "number")
    ]);
    assert.deepEqual(await run(feature, wrap({ lat: 0, long: [0] })), [
      failure("article.contact.geo.long", "type", "number")
    ]);

    assert.deepEqual(await run(feature, wrap({ lat: null, long: null })), [
      failure("article.contact.geo.lat", "type", "number"),
      failure("article.contact.geo.long", "type", "number")
    ]);
  });
});

QUnit.test(`simple ${validators.strictObject.name}`, async assert => {
  const geo = validators.strictObject({
    lat: validators.isNumber(),
    long: validators.isNumber()
  });

  assert.equal(
    format(validates(geo)),
    `(pipe (is-object) (keys "lat" "long") (fields lat=(is-number) long=(is-number)))`
  );

  assert.deepEqual(await run(geo, { lat: 0, long: 0 }), success());

  assert.deepEqual(await run(geo, { lat: 0 }), [
    keysError({ missing: ["long"] })
  ]);

  assert.deepEqual(await run(geo, { lat: 0, long: 0, extraData: 1 }), [
    keysError({ extra: ["extraData"] })
  ]);

  assert.deepEqual(await run(geo, { lat: 0, extraData: 1 }), [
    keysError({ missing: ["long"], extra: ["extraData"] })
  ]);
});
