import {
  keysError,
  missingError,
  setupSchemaTest,
  teardownSchemaTest,
  subject,
  typeError,
  validate,
  validateDraft,
  validatePublished,
} from "./support";
import { SimpleArticle } from "./support/records";

describe("[schema] - simple schema", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("all fields are optional in draft mode", async () => {
    const { registry } = subject();
    expect(
      await validateDraft(SimpleArticle, registry, {
        hed: null,
        dek: null,
        body: null,
      })
    ).toEqual([]);
  });

  test("extra fields are permitted when strictKeys is false in draft mode", async () => {
    const { registry } = subject();
    expect(
      await validate(
        SimpleArticle.with({ strictKeys: false, draft: true, registry }),
        {
          hed: null,
          dek: null,
          body: null,
          other: null,
        }
      )
    ).toEqual([]);
  });

  test("extra fields are permitted when strictKeys is false in publish mode", async () => {
    const { registry } = subject();
    expect(
      await validate(SimpleArticle.with({ strictKeys: false, registry }), {
        hed: "hello world",
        dek: "this is the dek",
        body: "the body goes here",
        other: null,
      })
    ).toEqual([]);
  });

  test("draft mode can accept the widened type", async () => {
    const { registry } = subject();
    expect(
      await validateDraft(SimpleArticle, registry, {
        hed: "Hello world\nMultiline strings are allowed in SingleLine",
        dek: "Hello, the cool world!",
        body: null,
      })
    ).toEqual([]);
  });

  test("published drafts must be narrow", async () => {
    const { registry } = subject();
    expect(
      await validatePublished(SimpleArticle, registry, {
        hed: "Hello world\nProblem here!",
        dek: "Hello, the cool world!",
        body: null,
      })
    ).toEqual([typeError("string:single-line", "hed"), missingError("body")]);
  });

  test("empty strings are not allowed by default", async () => {
    const { registry } = subject();
    expect(
      await validatePublished(SimpleArticle, registry, {
        hed: "",

        // dek is allowed to be an empty string, because its type is not required
        dek: "",
        body: "",
      })
    ).toEqual([
      {
        message: {
          details: null,
          name: "blank",
        },
        path: ["hed"],
      },
      {
        message: {
          details: null,
          name: "blank",
        },
        path: ["body"],
      },
    ]);
  });

  test("parsing", () => {
    const { registry } = subject();
    expect(
      SimpleArticle.with({ registry }).parse({
        hed: "Hello world",
        body: "The body",
      })
    ).toEqual({
      hed: "Hello world",
      dek: null,
      body: "The body",
    });

    expect(
      SimpleArticle.with({ registry }).parse({
        hed: "Hello world",
        dek: "Hello. Hello world.",
        body: "The body",
      })
    ).toEqual({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
    });
  });

  test("serialize", () => {
    const { registry } = subject();
    expect(
      SimpleArticle.with({ registry }).serialize({
        hed: "Hello world",
        dek: null,
        body: "The body",
      })
    ).toEqual({
      hed: "Hello world",
      body: "The body",
    });

    expect(
      SimpleArticle.with({ registry }).serialize({
        hed: "Hello world",
        dek: "Hello. Hello world.",
        body: "The body",
      })
    ).toEqual({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
    });
  });

  test("a valid published draft", async () => {
    const { registry } = subject();
    expect(
      await validatePublished(SimpleArticle, registry, {
        hed: "Hello world",
        dek: "Hello, the cool world!\nMultiline allowed here",
        body: "Hello world.\nThis text is permitted.\nTotally fine.",
      })
    ).toEqual([]);
  });

  test("Invalid shape with strictKeys", async () => {
    const { registry } = subject();
    expect(
      await validatePublished(SimpleArticle, registry, false as any)
    ).toEqual([typeError("object", null)]);

    expect(await validatePublished(SimpleArticle, registry, [] as any)).toEqual(
      [typeError("object", null)]
    );

    expect(
      await validatePublished(SimpleArticle, registry, (() => null) as any)
    ).toEqual([typeError("object", null)]);

    expect(await validatePublished(SimpleArticle, registry, {})).toEqual([
      keysError({
        missing: ["hed", "dek", "body"],
      }),
    ]);

    expect(
      await validatePublished(SimpleArticle, registry, {
        hed: "Hello world",
        dek: "Hello, the cool world!",
      })
    ).toEqual([
      keysError({
        missing: ["body"],
      }),
    ]);

    expect(
      await validatePublished(SimpleArticle, registry, {
        hed: "Hello world",
        dek: "Hello, the cool world!",
        body: "Hello!!!",
        wat: "dis",
      })
    ).toEqual([
      keysError({
        extra: ["wat"],
      }),
    ]);

    expect(
      await validatePublished(SimpleArticle, registry, {
        hed: "Hello world",
        dek: "Hello, the cool world!",
        wat: "dis",
      })
    ).toEqual([
      keysError({
        missing: ["body"],
        extra: ["wat"],
      }),
    ]);
  });

  test("Shape restrictions are relaxed with strictKeys: false", async () => {
    const { registry } = subject();
    const sloppy = SimpleArticle.with({ registry, strictKeys: false });

    expect(await validate(sloppy, false as any)).toEqual([
      typeError("object", null),
    ]);

    expect(await validate(sloppy, [] as any)).toEqual([
      typeError("object", null),
    ]);

    expect(await validate(sloppy, (() => null) as any)).toEqual([
      typeError("object", null),
    ]);

    expect(await validate(sloppy, {})).toEqual([
      missingError("hed"),
      missingError("body"),
    ]);

    expect(
      await validate(sloppy, {
        hed: "Hello world",
      })
    ).toEqual([missingError("body")]);

    expect(
      await validate(sloppy, {
        hed: "Hello world",
        dek: "Hello, the cool world!",
        body: "Hello!!!",
        wat: "dis",
      })
    ).toEqual([]);

    expect(
      await validate(sloppy, {
        hed: "Hello world",
        body: "Hello, the cool world!",
        wat: "dis",
      })
    ).toEqual([]);
  });
});
