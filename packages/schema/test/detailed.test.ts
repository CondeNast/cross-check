import {
  error,
  missingError,
  subject,
  setupSchemaTest,
  teardownSchemaTest,
  typeError,
  urlish,
} from "./support";
import { MediumArticle } from "./support/records";

function create(object: Record<string, unknown> = {}) {
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
    relatedArticles: null,
    ...object,
  };
}

describe("[schema] - detailed schema", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("missing fields (including dictionaries with required fields inside and required arrays)", async () => {
    const { validate } = subject(MediumArticle);
    expect(await validate.sloppy({})).toEqual([missingError("hed")]);
  });

  test("drafts", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.sloppy({
        hed: "Not\nactually\na\nsingle\nline",
        canonicalUrl: "totally -- invalid :: url",
      })
    ).toEqual([]);

    expect(
      await validate.sloppy({
        hed: "hello world",
        categories: [],
      })
    ).toEqual([]);

    expect(
      await validate.sloppy({
        hed: "hello world",
        categories: ["This\nis\na multiline\nstring"],
      })
    ).toEqual([]);
  });

  test("published documents", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.published({
        hed: "Not\nactually\na\nsingle\nline",
        dek: null,
        body: null,
        author: null,
        issueDate: null,
        canonicalUrl: "totally -- invalid :: url",
        tags: null,
        categories: null,
        geo: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([
      typeError("string:single-line", "hed"),
      missingError("body"),
      error("url", ["absolute"], "canonicalUrl"),
      missingError("categories"),
    ]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        tags: [1, "tag", {}],
        categories: ["single"],

        dek: null,
        author: null,
        issueDate: null,
        canonicalUrl: null,
        geo: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([typeError("string", "tags.0"), typeError("string", "tags.2")]);
  });

  test("dates (issueDate)", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.sloppy({
        hed: "hello world",
        issueDate: "not -- a valid :: date",
      })
    ).toEqual([typeError("iso-date", "issueDate")]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        issueDate: "not -- a valid :: date",
        categories: ["single"],

        dek: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        geo: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([typeError("iso-date", "issueDate")]);
  });

  test("optional dictionaries (geo)", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.sloppy({
        hed: "hello world",
        geo: {
          lat: null,
          long: null,
        },
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: {
          lat: null,
          long: null,
        },
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([missingError("geo.lat"), missingError("geo.long")]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        geo: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        categories: null,
        geo: null,
        relatedArticles: null,
      })
    ).toEqual([missingError("categories")]);

    expect(
      await validate.sloppy({
        hed: "hello world",
        geo: { lat: "10", long: "20" },

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        categories: null,
      })
    ).toEqual([
      typeError("number", "geo.lat"),
      typeError("number", "geo.long"),
    ]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: "10", long: "20" },
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([
      typeError("number", "geo.lat"),
      typeError("number", "geo.long"),
    ]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10.5, long: 20.5 },
        categories: ["single"],

        dek: null,
        issueDate: null,
        author: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        relatedArticles: null,
      })
    ).toEqual([
      typeError("number:integer", "geo.lat"),
      typeError("number:integer", "geo.long"),
    ]);

    expect(
      await validate.sloppy({
        hed: "hello world",
        author: { first: "Christina\nTODO: Check", last: "Kung" },
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        author: { first: "Christina\nTODO: Check", last: "Kung" },
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null,
        relatedArticles: null,
      })
    ).toEqual([typeError("string:single-line", "author.first")]);
  });

  test("optional dictionaries (geo)", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.sloppy({
        hed: "hello world",
        geo: {
          lat: null,
          long: null,
        },
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: {
          lat: null,
          long: null,
        },
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([missingError("geo.lat"), missingError("geo.long")]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null,
        categories: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([missingError("categories")]);

    expect(
      await validate.sloppy({
        hed: "hello world",
        geo: { lat: "10", long: "20" },
      })
    ).toEqual([
      typeError("number", "geo.lat"),
      typeError("number", "geo.long"),
    ]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: "10", long: "20" },
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([
      typeError("number", "geo.lat"),
      typeError("number", "geo.long"),
    ]);

    expect(
      await validate.sloppy({
        hed: "hello world",
        author: { first: "Christina\nTODO: Check", last: "Kung" },
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        author: { first: "Christina\nTODO: Check", last: "Kung" },
        body: "Hello world\nMore content",
        categories: ["single"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        geo: null,
        relatedArticles: null,
      })
    ).toEqual([typeError("string:single-line", "author.first")]);
  });

  test("required lists (categories)", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        categories: [],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([typeError("present-array", "categories")]);

    expect(
      await validate.sloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        categories: [],
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null,
        categories: null,
        relatedArticles: null,
      })
    ).toEqual([typeError("present", "categories")]);

    expect(
      await validate.sloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
      })
    ).toEqual([]);
  });

  test("optional lists (tags)", async () => {
    const { validate } = subject(MediumArticle);
    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        tags: [],
        categories: ["somecategory"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        contributors: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([]);

    expect(
      await validate.sloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        tags: [],
        categories: ["somecategory"],
      })
    ).toEqual([]);

    expect(
      await validate.published({
        hed: "A single line",
        body: "Hello world\nMore content",
        geo: { lat: 10, long: 20 },
        categories: ["somecategory"],

        dek: null,
        issueDate: null,
        canonicalUrl: null,
        tags: null,
        contributors: null,
        author: null,
        relatedArticles: null,
      })
    ).toEqual([]);

    expect(
      await validate.sloppy({
        hed: "A single line",
        body: "Hello world\nMore content",
        categories: ["somecategory"],
        geo: { lat: 10, long: 20 },
      })
    ).toEqual([]);
  });

  test("parsing", () => {
    const { registry } = subject(MediumArticle);
    expect(
      MediumArticle.with({ registry }).parse({
        hed: "Hello world",
        body: "The body",
        categories: ["one category", "two categories"],
      })
    ).toMatchSnapshot();

    expect(
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
        contributors: null,
        relatedArticles: null,
      })
    ).toMatchSnapshot();

    const date = new Date("2011-10-10T14:48:00Z");
    const url = urlish("https://example.com/path/to/hello");

    expect(
      MediumArticle.with({ registry }).parse({
        hed: "Hello world",
        dek: "Hello. Hello world.",
        body: "The body",
        author: {
          first: "Christina",
          // nested missing stuff serializes to nulls
        },
        issueDate: date.toISOString(),
        canonicalUrl: url.toString(),
        tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
        categories: ["one category", "two categories"],
        geo: {
          lat: 100,
          long: 100,
        },
        contributors: [
          { first: "Dan" },
          { last: "Ohara" },
          { first: "Godfrey", last: "Chan" },
        ],
        relatedArticles: null,
      })
    ).toMatchSnapshot();
  });

  test("serializing", () => {
    const { registry } = subject(MediumArticle);
    expect(
      MediumArticle.with({ registry }).serialize(
        create({
          hed: "Hello world",
          body: "The body",
          categories: ["one category", "two categories"],
        })
      )
    ).toMatchSnapshot();

    const date = new Date("2011-10-10T14:48:00Z");
    const url = urlish("https://example.com/path/to/hello");

    expect(
      MediumArticle.with({ registry }).serialize(
        create({
          hed: "Hello world",
          dek: "Hello. Hello world.",
          body: "The body",
          author: {
            first: "Christina",
            last: null,
          },
          issueDate: date,
          canonicalUrl: url,
          tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
          categories: ["one category", "two categories"],
          geo: {
            lat: 100,
            long: 100,
          },
          contributors: [
            { first: "Dan", last: null },
            { first: null, last: "Ohara" },
            { first: "Godfrey", last: "Chan" },
          ],
        })
      )
    ).toMatchSnapshot();
  });
});
