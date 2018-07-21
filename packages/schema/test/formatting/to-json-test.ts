import { toJSON } from "@cross-check/schema";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

QUnit.module("formatting - toJSON");

QUnit.test("simple", assert => {
  assert.deepEqual(toJSON(SimpleArticle), {
    fields: {
      hed: { type: "SingleLine", required: true },
      dek: { type: "Text", required: null },
      body: { type: "Text", required: true }
    },

    metadata: {
      collectionName: "simple-articles",
      modelName: "simple-article"
    }
  });

  assert.deepEqual(toJSON(SimpleArticle.draft), {
    fields: {
      hed: { type: "Text", required: false },
      dek: { type: "Text", required: false },
      body: { type: "Text", required: false }
    },

    metadata: {
      collectionName: "simple-articles",
      modelName: "simple-article"
    }
  });
});

QUnit.test("detailed - published", assert => {
  let actual = toJSON(MediumArticle);
  let fields = {
    hed: { type: "SingleLine", required: true },
    dek: { type: "Text", required: null },
    body: { type: "Text", required: true },
    author: {
      type: "Dictionary",
      members: {
        first: { type: "SingleLine", required: null },
        last: { type: "SingleLine", required: null }
      },
      required: null
    },

    issueDate: { type: "ISODate", required: null },
    canonicalUrl: { type: "Url", args: [], required: null },
    tags: {
      type: "List",
      of: {
        type: "SingleWord",
        required: null
      },
      required: null
    },
    categories: {
      type: "List",
      of: {
        type: "SingleLine",
        required: null
      },
      required: true
    },
    geo: {
      type: "Dictionary",
      members: {
        lat: { type: "Integer", required: true },
        long: { type: "Integer", required: true }
      },
      required: null
    },
    contributors: {
      type: "List",
      required: null,
      of: {
        type: "Dictionary",
        required: null,
        members: {
          first: { type: "SingleLine", required: null },
          last: { type: "SingleLine", required: null }
        }
      }
    }
  };

  let expected = {
    fields,
    metadata: {
      collectionName: "medium-articles",
      modelName: "medium-article"
    }
  };

  assert.deepEqual(actual, expected);
});

QUnit.test("detailed - draft", assert => {
  let actual = toJSON(MediumArticle.draft);
  let fields = {
    hed: { type: "Text", required: false },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: false },
    author: {
      type: "Dictionary",
      members: {
        first: { type: "Text", required: false },
        last: { type: "Text", required: false }
      },
      required: false
    },

    issueDate: { type: "ISODate", required: false },
    canonicalUrl: { type: "Text", required: false },
    tags: {
      type: "List",
      of: {
        type: "Text",
        required: null
      },
      required: false
    },
    categories: {
      type: "List",
      of: {
        type: "Text",
        required: null
      },
      required: false
    },
    geo: {
      type: "Dictionary",
      members: {
        lat: { type: "Integer", required: false },
        long: { type: "Integer", required: false }
      },
      required: false
    },
    contributors: {
      type: "List",
      required: false,
      of: {
        type: "Dictionary",
        required: null,
        members: {
          first: { type: "Text", required: false },
          last: { type: "Text", required: false }
        }
      }
    }
  };

  let expected = {
    fields,
    metadata: {
      collectionName: "medium-articles",
      modelName: "medium-article"
    }
  };

  assert.deepEqual(actual, expected);
});

QUnit.test("relationships", assert => {
  assert.deepEqual(
    toJSON(Related),
    {
      fields: {
        first: { type: "SingleLine", required: null },
        last: { type: "Text", required: null },
        person: {
          type: "Pointer",
          kind: "hasOne",
          required: true,
          of: {
            alias: "SimpleArticle",
            required: null
          }
        },
        articles: {
          type: "Iterator",
          kind: "hasMany",
          required: null,
          of: {
            alias: "MediumArticle",
            required: null
          }
        }
      },
      metadata: {
        collectionName: "related-articles",
        modelName: "related-article"
      }
    },
    "Related"
  );

  assert.deepEqual(
    toJSON(Related.draft),

    {
      fields: {
        first: { type: "Text", required: false },
        last: { type: "Text", required: false },
        person: {
          type: "Pointer",
          kind: "hasOne",
          required: false,
          of: {
            alias: "SimpleArticle",
            required: null
          }
        },
        articles: {
          type: "Iterator",
          kind: "hasMany",
          required: false,
          of: {
            alias: "MediumArticle",
            required: false
          }
        }
      },
      metadata: {
        collectionName: "related-articles",
        modelName: "related-article"
      }
    },
    "Related.draft"
  );
});
