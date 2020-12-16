import { Record, toJSON, types } from "@cross-check/schema";
import {
  keysError,
  missingError,
  module,
  typeError,
  validate,
} from "./support";

module(
  "[schema] issue #9 - List(Record) is equivalent to List(Named(Dictionary))",
  () => {
    module("optional list", (test) => {
      test("toJSON", async (assert, { registry }) => {
        const Inner = Record("inner", {
          fields: {
            hed: types.SingleWord().required(),
          },
        });

        registry.register(Inner);

        const TestCase = Record("list-of-record", {
          fields: {
            list: types.List(Inner),
          },
        });

        registry.register(TestCase);

        const actual = toJSON(TestCase, registry);

        assert.deepEqual(actual, {
          fields: {
            list: {
              type: "List",
              args: { allowEmpty: true },
              of: { alias: "inner", required: true },
              required: false,
            },
          },
          metadata: null,
        });
      });

      test("validation", async (assert, { registry }) => {
        const Inner = Record("inner", {
          fields: {
            hed: types.SingleWord().required(),
          },
        });

        registry.register(Inner);

        const TestCase = Record("list-of-record", {
          fields: {
            list: types.List(Inner),
          },
        });

        registry.register(TestCase);

        assert.deepEqual(
          await validate(TestCase.with({ registry }), { list: null }),
          []
        );
        assert.deepEqual(
          await validate(TestCase.with({ registry }), { list: [null] }),
          [missingError("list.0")],
          "a list's contents must not be null"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true, registry }), {
            list: [null],
          }),
          [missingError("list.0")],
          "a list's contents may not be null even in draft mode"
        );
        assert.deepEqual(
          await validate(TestCase.with({ registry }), { list: [{}] }),
          [keysError({ missing: ["hed"], path: "list.0" })],
          "a list's Record contents must pass the inner shape validations"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true, registry }), {
            list: [{}],
          }),
          [keysError({ missing: ["hed"], path: "list.0" })],
          "a list's Record contents must pass the inner shape validations even in draft mode"
        );
        assert.deepEqual(
          await validate(TestCase.with({ registry }), { list: [{ hed: 1 }] }),
          [typeError("string", "list.0.hed")],
          "a list's Record contents must pass the inner type validations"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true, registry }), {
            list: [{ hed: 1 }],
          }),
          [typeError("string", "list.0.hed")],
          "a list's Record contents must pass the inner type validations even in draft mode"
        );
        assert.deepEqual(
          await validate(TestCase.with({ registry }), {
            list: [{ hed: "hello world" }],
          }),
          [typeError("string:single-word", "list.0.hed")],
          "a list's Record contents must pass the scalar validations"
        );
        assert.deepEqual(
          await validate(TestCase.with({ draft: true, registry }), {
            list: [{ hed: "hello world" }],
          }),
          [],
          "a list's Record contents need not pass the scalar validations in draft mode"
        );
      });
    });

    module("required list", (test) => {
      test("toJSON", async (assert, { registry }) => {
        const Inner = Record("inner", {
          fields: {
            hed: types.Text().required(),
          },
        });

        registry.register(Inner);

        const TestCase = Record("list-of-record", {
          fields: {
            list: types.List(Inner).required(),
          },
        });

        registry.register(TestCase);

        const actual = toJSON(TestCase, registry);

        assert.deepEqual(actual, {
          fields: {
            list: {
              type: "List",
              of: { alias: "inner", required: true },
              required: true,
            },
          },
          metadata: null,
        });
      });

      test("validation", async (assert, { registry }) => {
        const Inner = Record("inner", {
          fields: {
            hed: types.Text().required(),
          },
        });

        registry.register(Inner);

        const TestCase = Record("list-of-record", {
          fields: {
            list: types.List(Inner).required(),
          },
        });

        registry.register(TestCase);

        assert.deepEqual(
          await validate(TestCase.with({ registry }), { list: null }),
          [missingError("list")],
          "A required list must be present"
        );

        assert.deepEqual(
          await validate(TestCase.with({ draft: true, registry }), {
            list: null,
          }),
          [],
          "A required list may be null in draft mode"
        );

        assert.deepEqual(
          await validate(TestCase.with({ draft: true, registry }), {}),
          [keysError({ missing: ["list"] })],
          "Strict keys are still required in draft mode"
        );

        assert.deepEqual(
          await validate(TestCase.with({ strictKeys: false, registry }), {}),
          [missingError("list")],
          "Required fields are still required even if strictKeys are false"
        );
      });
    });
  }
);
