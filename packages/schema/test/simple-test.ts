import {
  keysError,
  missingError,
  typeError,
  validate,
  validateDraft,
  validatePublished
} from "./support";
import { SimpleArticle } from "./support/records";

QUnit.module("[schema] - simple schema");

QUnit.test("all fields are optional in draft mode", async assert => {
  assert.deepEqual(
    await validateDraft(SimpleArticle, {
      hed: null,
      dek: null,
      body: null
    }),
    [],
    "all fields can be null in drafts"
  );
});

QUnit.test(
  "extra fields are permitted when strictKeys is false in draft mode",
  async assert => {
    assert.deepEqual(
      await validate(SimpleArticle.with({ strictKeys: false, draft: true }), {
        hed: null,
        dek: null,
        body: null,
        other: null
      }),
      [],
      "extra fields are permitted when strictKeys is false in draft mode"
    );
  }
);

QUnit.test(
  "extra fields are permitted when strictKeys is false in publish mode",
  async assert => {
    assert.deepEqual(
      await validate(SimpleArticle.with({ strictKeys: false }), {
        hed: "hello world",
        dek: "this is the dek",
        body: "the body goes here",
        other: null
      }),
      [],
      "extra fields are permitted when strictKeys is false in publish mode"
    );
  }
);

QUnit.test("draft mode can accept the widened type", async assert => {
  assert.deepEqual(
    await validateDraft(SimpleArticle, {
      hed: "Hello world\nMultiline strings are allowed in SingleLine",
      dek: "Hello, the cool world!",
      body: null
    }),
    [],
    "draft mode can accept the widened type"
  );
});

QUnit.test("published drafts must be narrow", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world\nProblem here!",
      dek: "Hello, the cool world!",
      body: null
    }),
    [typeError("string:single-line", "hed"), missingError("body")],
    "published records must not be missing fields or have the widened type"
  );
});

QUnit.test("empty strings are not allowed by default", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "",

      // dek is allowed to be an empty string, because its type is not required
      dek: "",
      body: ""
    }),
    [missingError("hed"), missingError("body")],
    "published records must not be missing fields or have the widened type"
  );
});

QUnit.test("parsing", assert => {
  assert.deepEqual(
    SimpleArticle.with().parse({
      hed: "Hello world",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body"
    }
  );

  assert.deepEqual(
    SimpleArticle.with().parse({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }
  );
});

QUnit.test("serialize", assert => {
  assert.deepEqual(
    SimpleArticle.with().serialize({
      hed: "Hello world",
      dek: null,
      body: "The body"
    }),
    {
      hed: "Hello world",
      body: "The body"
    }
  );

  assert.deepEqual(
    SimpleArticle.with().serialize({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }
  );
});

QUnit.test("a valid published draft", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!\nMultiline allowed here",
      body: "Hello world.\nThis text is permitted.\nTotally fine."
    }),
    [],
    "a valid draft"
  );
});

QUnit.test("Invalid shape with strictKeys", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, false as any),
    [typeError("object", null)],
    "false is not an object"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, [] as any),
    [typeError("object", null)],
    "[] is not an object"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, (() => null) as any),
    [typeError("object", null)],
    "function is not an object"
  );

  QUnit.dump.maxDepth = 10;

  assert.deepEqual(
    await validatePublished(SimpleArticle, {}),
    [
      keysError({
        missing: ["hed", "dek", "body"]
      })
    ],
    "missing all fields"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!"
    }),
    [
      keysError({
        missing: ["body"]
      })
    ],
    "missing one field"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!",
      body: "Hello!!!",
      wat: "dis"
    }),
    [
      keysError({
        extra: ["wat"]
      })
    ],
    "extra fields"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!",
      wat: "dis"
    }),
    [
      keysError({
        missing: ["body"],
        extra: ["wat"]
      })
    ],
    "extra and missing fields"
  );
});

QUnit.test(
  "Shape restrictions are relaxed with strictKeys: false",
  async assert => {
    let sloppy = SimpleArticle.with({ strictKeys: false });

    assert.deepEqual(
      await validate(sloppy, false as any),
      [typeError("object", null)],
      "false is not an object even when strictKeys is false"
    );

    assert.deepEqual(
      await validate(sloppy, [] as any),
      [typeError("object", null)],
      "[] is not an object even when strictKeys is false"
    );

    assert.deepEqual(
      await validate(sloppy, (() => null) as any),
      [typeError("object", null)],
      "function is not an object even when strictKeys is false"
    );

    //   QUnit.dump.maxDepth = 10;

    assert.deepEqual(
      await validate(sloppy, {}),
      [missingError("hed"), missingError("body")],
      "required fields still may not be undefined, but optional fields may be undefined if strictKeys is false"
    );

    assert.deepEqual(
      await validate(sloppy, {
        hed: "Hello world"
      }),
      [missingError("body")],
      "required fields still may not be undefined, but optional fields may be undefined if strictKeys is false"
    );

    assert.deepEqual(
      await validate(sloppy, {
        hed: "Hello world",
        dek: "Hello, the cool world!",
        body: "Hello!!!",
        wat: "dis"
      }),
      [],
      "extra fields are allowed when strictKeys is false"
    );

    assert.deepEqual(
      await validate(sloppy, {
        hed: "Hello world",
        body: "Hello, the cool world!",
        wat: "dis"
      }),
      [],
      "missing optional fields and extra fields are allowed when strictKeys is false"
    );
  }
);
