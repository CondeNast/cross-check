import { Dict } from "ts-std";
import { error, missingError, module, typeError, urlish } from "./support";
import { MediumArticle } from "./support/records";

function create(object: Dict = {}) {
  return {
    hed: null,
    dek: null,
    body: null,
    author: null,
    issueDate: null,
    canonicalUrl: null,
    tags: null,
    categories: null,
    geo: null,
    contributors: null,
    ...object
  };
}

const mod = module("[schema] - detailed schema", {
  record: MediumArticle
});

mod.test(
  "missing fields (including dictionaries with required fields inside and required arrays)",
  async (assert, { validateSloppy }) => {
    assert.deepEqual(
      await validateSloppy({}),
      [missingError("hed")],
      "draft records can be missing fields (but not `required('always')`)"
    );
  }
);

mod.test("drafts", async (assert, { validateSloppy }) => {
  assert.deepEqual(
    await validateSloppy({
      hed: "Not\nactually\na\nsingle\nline",
      canonicalUrl: "totally -- invalid :: url"
    }),
    [],
    "can be missing fields"
  );

  assert.deepEqual(
    await validateSloppy({
      hed: "hello world",
      categories: []
    }),
    [],
    "can supply empty arrays for required arrays"
  );

  assert.deepEqual(
    await validateSloppy({
      hed: "hello world",
      categories: ["This\nis\na multiline\nstring"]
    }),
    [],
    "arrays use the draft type of their members"
  );
});

mod.test("published documents", async (assert, { validatePublished }) => {
  assert.deepEqual(
    await validatePublished({
      hed: "Not\nactually\na\nsingle\nline",
      dek: null,
      body: null,
      author: null,
      issueDate: null,
      canonicalUrl: "totally -- invalid :: url",
      tags: null,
      categories: null,
      geo: null,
      contributors: null
    }),
    [
      typeError("string:single-line", "hed"),
      missingError("body"),
      error("url", ["absolute"], "canonicalUrl"),
      missingError("categories")
    ],
    "match the schema"
  );

  assert.deepEqual(
    await validatePublished({
      hed: "A single line",
      body: "Hello world\nMore content",
      tags: [1, "tag", {}],
      categories: ["single"],

      dek: null,
      author: null,
      issueDate: null,
      canonicalUrl: null,
      geo: null,
      contributors: null
    }),
    [typeError("string", "tags.0"), typeError("string", "tags.2")],
    "if an optional field is present, it must match the schema"
  );
});

mod.test(
  "dates (issueDate)",
  async (assert, { validateSloppy, validatePublished }) => {
    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        issueDate: "not -- a valid :: date"
      }),
      [typeError("iso-date", "issueDate")],
      "dates don't widen into strings for drafts"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        issueDate: "not -- a valid :: date",
        categories: ["single"],

        dek: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        geo: null,
        contributors: null
      }),
      [typeError("iso-date", "issueDate")]
    );
  }
);

mod.test(
  "optional dictionaries (geo)",
  async (assert, { validateSloppy, validatePublished }) => {
    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        geo: {
          lat: null,
          long: null
        }
      }),
      [],
      "drafts do not need nested required fields"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: {
          lat: null,
          long: null
        },
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null
      }),
      [missingError("geo.lat"), missingError("geo.long")],
      "published documents must include nested required fields if dictionary is present"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        geo: null,
        canonicalUrl: null,
        tags: null,
        contributors: null
      }),
      [],
      "published documents may leave out optional dictionaries"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        categories: null,
        geo: null
      }),
      [missingError("categories")],
      "published documents may not leave out required dictionaries"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        geo: { lat: "10", long: "20" },

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        categories: null
      }),
      [typeError("number", "geo.lat"), typeError("number", "geo.long")],
      "nested fields in drafts use the draft type (but numbers still aren't strings)"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: "10", long: "20" },
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null
      }),
      [typeError("number", "geo.lat"), typeError("number", "geo.long")],
      "nested fields in published documents use the record type (but numbers aren't strings)"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10.5, long: 20.5 },
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null
      }),
      [
        typeError("number:integer", "geo.lat"),
        typeError("number:integer", "geo.long")
      ],
      "nested fields in published documents use the record type (floats aren't integers)"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        author: { first: "Christina\nTODO: Check", last: "Kung" }
      }),
      [],
      "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        author: { first: "Christina\nTODO: Check", last: "Kung" },
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null
      }),
      [typeError("string:single-line", "author.first")],
      "nested fields in published documents use the record type (multiline strings are not valid single-line strings)"
    );
  }
);

mod.test(
  "optional dictionaries (geo)",
  async (assert, { validateSloppy, validatePublished }) => {
    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        geo: {
          lat: null,
          long: null
        }
      }),
      [],
      "drafts do not need nested required fields"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: {
          lat: null,
          long: null
        },
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null
      }),
      [missingError("geo.lat"), missingError("geo.long")],
      "published documents must include nested required fields if dictionary is present"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null,
        author: null
      }),
      [],
      "published documents may leave out optional dictionaries"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null,
        categories: null,
        author: null
      }),
      [missingError("categories")],
      "published documents may not leave out required dictionaries"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        geo: { lat: "10", long: "20" }
      }),
      [typeError("number", "geo.lat"), typeError("number", "geo.long")],
      "nested fields in drafts use the draft type (but numbers still are't strings)"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: "10", long: "20" },
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null
      }),
      [typeError("number", "geo.lat"), typeError("number", "geo.long")],
      "nested fields in published documents use the record type (but numbers aren't strings)"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "hello world",
        author: { first: "Christina\nTODO: Check", last: "Kung" }
      }),
      [],
      "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        author: { first: "Christina\nTODO: Check", last: "Kung" },
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null
      }),
      [typeError("string:single-line", "author.first")],
      "nested fields in published documents use the record type (multiline strings are not valid single-line strings)"
    );
  }
);

mod.test(
  "required lists (categories)",
  async (assert, { validateSloppy, validatePublished }) => {
    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        categories: [],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null
      }),
      [typeError("present-array", "categories")],
      "in published documents, required lists must have at least one element"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        categories: []
      }),
      [],
      "in drafts, required lists may be empty"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null,
        categories: null
      }),
      [typeError("present", "categories")],
      "in published documents, required lists may not be missing"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 }
      }),
      [],
      "in drafts, required lists may be missing"
    );
  }
);

mod.test(
  "optional lists (tags)",
  async (assert, { validateSloppy, validatePublished }) => {
    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        tags: [],
        categories: ["somecategory"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        contributors: null,
        author: null
      }),
      [],
      "in published documents, optional lists may be empty"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        tags: [],
        categories: ["somecategory"]
      }),
      [],
      "in drafts, optional lists may be empty"
    );

    assert.deepEqual(
      await validatePublished({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        categories: ["somecategory"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null
      }),
      [],
      "in published documents, optional lists may be missing"
    );

    assert.deepEqual(
      await validateSloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        categories: ["somecategory"],
        geo: { lat: 10, long: 20 }
      }),
      [],
      "in drafts, optional lists may be missing"
    );
  }
);

mod.test("parsing", (assert, { registry }) => {
  assert.deepEqual(
    MediumArticle.with({ registry }).parse({
      hed: "Hello world",
      body: "The body",
      categories: ["one category", "two categories"]
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }
  );

  assert.deepEqual(
    MediumArticle.with({ registry }).parse({
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }
  );

  let date = new Date();
  let url = urlish("https://example.com/path/to/hello");

  assert.deepEqual(
    MediumArticle.with({ registry }).parse({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina"
        // nested missing stuff serializes to nulls
      },
      issueDate: date.toISOString(),
      canonicalUrl: url.toString(),
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan" },
        { last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina",
        last: null
      },
      issueDate: date,
      canonicalUrl: url,
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan", last: null },
        { first: null, last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }
  );
});

mod.test("serializing", (assert, { registry }) => {
  assert.deepEqual(
    MediumArticle.with({ registry }).serialize(
      create({
        hed: "Hello world",
        body: "The body",
        categories: ["one category", "two categories"]
      })
    ),
    {
      hed: "Hello world",
      body: "The body",
      categories: ["one category", "two categories"]
    }
  );

  let date = new Date();
  let url = urlish("https://example.com/path/to/hello");

  assert.deepEqual(
    MediumArticle.with({ registry }).serialize(
      create({
        hed: "Hello world",
        dek: "Hello. Hello world.",
        body: "The body",
        author: {
          first: "Christina",
          last: null
        },
        issueDate: date,
        canonicalUrl: url,
        tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
        categories: ["one category", "two categories"],
        geo: {
          lat: 100,
          long: 100
        },
        contributors: [
          { first: "Dan", last: null },
          { first: null, last: "Ohara" },
          { first: "Godfrey", last: "Chan" }
        ]
      })
    ),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina"
      },
      issueDate: date.toISOString(),
      canonicalUrl: url.toString(),
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan" },
        { last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }
  );
});
