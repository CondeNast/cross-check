import { REGISTRY, Record, types } from "@cross-check/schema";
import { keysError, missingError, typeError, validate } from "./support";

QUnit.module(
  "[schema] issue #9 - List(Record) is equivalent to List(Named(Dictionary))",
  () => {
    QUnit.module("optional list", () => {
      QUnit.test("validation", async assert => {
        const registry = REGISTRY.clone();

        const Inner = Record("inner", {
          fields: {
            hed: types.SingleWord().required()
          },
          registry
        });

        const TestCase = Record("list-of-record", {
          fields: {
            list: types.List(Inner)
          },
          registry
        });

        assert.deepEqual(await validate(TestCase.with(), { list: null }), []);
        assert.deepEqual(
          await validate(TestCase.with(), { list: [null] }),
          [missingError("list.0")],
          "a list's contents must not be null"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true }), { list: [null] }),
          [missingError("list.0")],
          "a list's contents may not be null even in draft mode"
        );
        assert.deepEqual(
          await validate(TestCase.with(), { list: [{}] }),
          [keysError({ missing: ["hed"], path: "list.0" })],
          "a list's Record contents must pass the inner shape validations"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true }), { list: [{}] }),
          [keysError({ missing: ["hed"], path: "list.0" })],
          "a list's Record contents must pass the inner shape validations even in draft mode"
        );
        assert.deepEqual(
          await validate(TestCase.with({ strictKeys: false }), { list: [{}] }),
          [],
          "a list's Record contents need not pass the inner shape validations when strict keys are disabled"
        );
        assert.deepEqual(
          await validate(TestCase.with(), { list: [{ hed: 1 }] }),
          [typeError("string", "list.0.hed")],
          "a list's Record contents must pass the inner type validations"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true }), {
            list: [{ hed: 1 }]
          }),
          [typeError("string", "list.0.hed")],
          "a list's Record contents must pass the inner type validations even in draft mode"
        );
        assert.deepEqual(
          await validate(TestCase.with(), { list: [{ hed: "hello world" }] }),
          [typeError("string:single-word", "list.0.hed")],
          "a list's Record contents must pass the scalar validations"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true }), {
            list: [{ hed: "hello world" }]
          }),
          [],
          "a list's Record contents need not pass the scalar validations in draft mode"
        );
      });
    });

    QUnit.module("required list", () => {
      QUnit.test("validation", async assert => {
        const registry = REGISTRY.clone();

        const Inner = Record("inner", {
          fields: {
            hed: types.Text().required()
          },
          registry
        });

        const TestCase = Record("list-of-record", {
          fields: {
            list: types.List(Inner).required()
          },
          registry
        });

        assert.deepEqual(
          await validate(TestCase.with(), { list: null }),
          [missingError("list")],
          "A required list must be present"
        );

        assert.deepEqual(
          await validate(TestCase.with({ draft: true }), { list: null }),
          [],
          "A required list may be null in draft mode"
        );

        assert.deepEqual(
          await validate(TestCase.with({ draft: true }), {}),
          [keysError({ missing: ["list"] })],
          "Strict keys are still required in draft mode"
        );

        assert.deepEqual(
          await validate(TestCase.with({ strictKeys: false }), {}),
          [missingError("list")],
          "Required fields are still required even if strictKeys are false"
        );
      });
    });
  }
);
