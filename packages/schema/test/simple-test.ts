import {
  keysError,
  missingError,
  module,
  typeError,
  validate,
  validateDraft,
  validatePublished
} from "./support";
import { SimpleArticle } from "./support/records";

const mod = module("[schema] - simple schema");

mod.test(
  "all fields are optional in draft mode",
  async (assert, { registry }) => {
    assert.deepEqual(
      await validateDraft(SimpleArticle, registry, {
        hed: null,
        dek: null,
        body: null,
        issueDate: null,
      }),
      [],
      "all fields can be null in drafts"
    );
  }
);

mod.test(
  "extra fields are permitted when strictKeys is false in draft mode",
  async (assert, { registry }) => {
    assert.deepEqual(
      await validate(
        SimpleArticle.with({ strictKeys: false, draft: true, registry }),
        {
          hed: null,
          dek: null,
          body: null,
          other: null
        }
      ),
      [],
      "extra fields are permitted when strictKeys is false in draft mode"
    );
  }
);

mod.test(
  "extra fields are permitted when strictKeys is false in publish mode",
  async (assert, { registry }) => {
    assert.deepEqual(
      await validate(SimpleArticle.with({ strictKeys: false, registry }), {
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

mod.test(
  "draft mode can accept the widened type",
  async (assert, { registry }) => {
    assert.deepEqual(
      await validateDraft(SimpleArticle, registry, {
        hed: "Hello world\nMultiline strings are allowed in SingleLine",
        dek: "Hello, the cool world!",
        body: null,
        issueDate: null
      }),
      [],
      "draft mode can accept the widened type"
    );
  }
);

mod.test("published drafts must be narrow", async (assert, { registry }) => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, {
      hed: "Hello world\nProblem here!",
      dek: "Hello, the cool world!",
      body: null,
      issueDate: null
    }),
    [typeError("string:single-line", "hed"), missingError("body")],
    "published records must not be missing fields or have the widened type"
  );
});

mod.test(
  "empty strings are not allowed by default",
  async (assert, { registry }) => {
    assert.deepEqual(
      await validatePublished(SimpleArticle, registry, {
        hed: "",

        // dek is allowed to be an empty string, because its type is not required
        dek: "",
        body: "",
        issueDate: null 
      }),
      [
        {
          message: {
            details: null,
            name: "blank"
          },
          path: ["hed"]
        },
        {
          message: {
            details: null,
            name: "blank"
          },
          path: ["body"]
        }
      ],
      "published records must not be missing fields or have the widened type"
    );
  }
);

mod.test("parsing", (assert, { registry }) => {
  assert.deepEqual(
    SimpleArticle.with({ registry }).parse({
      hed: "Hello world",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: null,
      issueDate: null,
      body: "The body"
    }
  );

  assert.deepEqual(
    SimpleArticle.with({ registry }).parse({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      issueDate: null 
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      issueDate: null 
    }
  );
});

mod.test("serialize", (assert, { registry }) => {
  assert.deepEqual(
    SimpleArticle.with({ registry }).serialize({
      hed: "Hello world",
      dek: null,
      issueDate: null,
      body: "The body"
    }),
    {
      hed: "Hello world",
      body: "The body"
    }
  );

  assert.deepEqual(
    SimpleArticle.with({ registry }).serialize({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      issueDate: null,
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }
  );
});

mod.test("a valid published draft", async (assert, { registry }) => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, {
      hed: "Hello world",
      dek: "Hello, the cool world!\nMultiline allowed here",
      body: "Hello world.\nThis text is permitted.\nTotally fine.",
      issueDate: null
    }),
    [],
    "a valid draft"
  );
});

mod.test("Invalid shape with strictKeys", async (assert, { registry }) => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, false as any),
    [typeError("object", null)],
    "false is not an object"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, [] as any),
    [typeError("object", null)],
    "[] is not an object"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, (() => null) as any),
    [typeError("object", null)],
    "function is not an object"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, {}),
    [
      keysError({
        missing: ["hed", "dek", "body", "issueDate"]
      })
    ],
    "missing all fields"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, {
      hed: "Hello world",
      dek: "Hello, the cool world!",
      issueDate: null
    }),
    [
      keysError({
        missing: ["body"]
      })
    ],
    "missing one field"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, {
      hed: "Hello world",
      dek: "Hello, the cool world!",
      body: "Hello!!!",
      wat: "dis",
      issueDate: null
    }),
    [
      keysError({
        extra: ["wat"]
      })
    ],
    "extra fields"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, registry, {
      hed: "Hello world",
      dek: "Hello, the cool world!",
      issueDate: null,
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

mod.test(
  "Shape restrictions are relaxed with strictKeys: false",
  async (assert, { registry }) => {
    let sloppy = SimpleArticle.with({ registry, strictKeys: false });

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
