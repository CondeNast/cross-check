import { Record, toJSON, types } from "@condenast/cross-check-schema";
import {
  keysError,
  missingError,
  setupSchemaTest,
  teardownSchemaTest,
  subject,
  typeError,
  validate,
} from "./support";

describe("[schema] issue #9 - List(Record) is equivalent to List(Named(Dictionary))", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  describe("optional list", () => {
    test("toJSON", async () => {
      const { registry } = subject();
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

      expect(actual).toEqual({
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

    test("validation", async () => {
      const { registry } = subject();
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

      expect(
        await validate(TestCase.with({ registry }), { list: null })
      ).toEqual([]);
      expect(
        await validate(TestCase.with({ registry }), { list: [null] })
      ).toEqual([missingError("list.0")]);
      expect(
        await validate(TestCase.with({ draft: true, registry }), {
          list: [null],
        })
      ).toEqual([missingError("list.0")]);
      expect(
        await validate(TestCase.with({ registry }), { list: [{}] })
      ).toEqual([keysError({ missing: ["hed"], path: "list.0" })]);
      expect(
        await validate(TestCase.with({ draft: true, registry }), {
          list: [{}],
        })
      ).toEqual([keysError({ missing: ["hed"], path: "list.0" })]);
      expect(
        await validate(TestCase.with({ registry }), { list: [{ hed: 1 }] })
      ).toEqual([typeError("string", "list.0.hed")]);
      expect(
        await validate(TestCase.with({ draft: true, registry }), {
          list: [{ hed: 1 }],
        })
      ).toEqual([typeError("string", "list.0.hed")]);
      expect(
        await validate(TestCase.with({ registry }), {
          list: [{ hed: "hello world" }],
        })
      ).toEqual([typeError("string:single-word", "list.0.hed")]);
      expect(
        await validate(TestCase.with({ draft: true, registry }), {
          list: [{ hed: "hello world" }],
        })
      ).toEqual([]);
    });
  });

  describe("required list", () => {
    test("toJSON", async () => {
      const { registry } = subject();
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

      expect(actual).toEqual({
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

    test("validation", async () => {
      const { registry } = subject();
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

      expect(
        await validate(TestCase.with({ registry }), { list: null })
      ).toEqual([missingError("list")]);

      expect(
        await validate(TestCase.with({ draft: true, registry }), {
          list: null,
        })
      ).toEqual([]);

      expect(
        await validate(TestCase.with({ draft: true, registry }), {})
      ).toEqual([keysError({ missing: ["list"] })]);

      expect(
        await validate(TestCase.with({ strictKeys: false, registry }), {})
      ).toEqual([missingError("list")]);
    });
  });
});
