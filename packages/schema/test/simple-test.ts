import {
  keysError,
  missingError,
  typeError,
  validateDraft,
  validatePublished
} from "./support";
import { SimpleArticle } from "./support/records";

QUnit.module("@cross-check/schema - simple schema");

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
    SimpleArticle.parse({
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
    SimpleArticle.parse({
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
    SimpleArticle.serialize({
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
    SimpleArticle.serialize({
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

QUnit.test("Invalid shape", async assert => {
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
