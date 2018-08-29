import { module } from "../support";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

const mod = module("[schema] formatting - toJSON");

mod.test("simple - published", (assert, { toJSON }) => {
  assert.deepEqual(toJSON(SimpleArticle), {
    fields: {
      hed: { type: "SingleLine", required: true },
      dek: { type: "Text", required: false, args: { allowEmpty: true } },
      body: { type: "Text", required: true }
    },

    metadata: {
      collectionName: "simple-articles",
      modelName: "simple-article"
    }
  });
});

mod.test("simple - draft", (assert, { registry, toJSON }) => {
  assert.deepEqual(toJSON(SimpleArticle.with({ draft: true, registry })), {
    fields: {
      hed: { type: "Text", required: false, args: { allowEmpty: true } },
      dek: { type: "Text", required: false, args: { allowEmpty: true } },
      body: { type: "Text", required: false, args: { allowEmpty: true } }
    },
    metadata: {
      collectionName: "simple-articles",
      modelName: "simple-article"
    }
  });
});

mod.test("detailed - published", (assert, { toJSON }) => {
  let actual = toJSON(MediumArticle);
  let fields = {
    hed: { type: "SingleLine", required: true },
    dek: { type: "Text", required: false, args: { allowEmpty: true } },
    body: { type: "Text", required: true },
    author: {
      type: "Dictionary",
      members: {
        first: {
          type: "SingleLine",
          required: false,
          args: { allowEmpty: true }
        },
        last: {
          type: "SingleLine",
          required: false,
          args: { allowEmpty: true }
        }
      },
      required: false
    },

    issueDate: { type: "ISODate", required: false },
    canonicalUrl: { type: "Url", args: [], required: false },
    tags: {
      type: "List",
      of: {
        type: "SingleWord",
        required: true
      },
      args: { allowEmpty: true },
      required: false
    },
    categories: {
      type: "List",
      of: {
        type: "SingleLine",
        required: true
      },
      required: true
    },
    geo: {
      type: "Dictionary",
      members: {
        lat: { type: "Integer", required: true },
        long: { type: "Integer", required: true }
      },
      required: false
    },
    contributors: {
      type: "List",
      required: false,
      args: { allowEmpty: true },
      of: {
        type: "Dictionary",
        required: true,
        members: {
          first: {
            type: "SingleLine",
            required: false,
            args: { allowEmpty: true }
          },
          last: {
            type: "SingleLine",
            required: false,
            args: { allowEmpty: true }
          }
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

mod.test("detailed - draft", (assert, { registry, toJSON }) => {
  let actual = toJSON(MediumArticle.with({ draft: true, registry }));
  let fields = {
    hed: { type: "Text", required: true },
    dek: { type: "Text", required: false, args: { allowEmpty: true } },
    body: { type: "Text", required: false, args: { allowEmpty: true } },
    author: {
      type: "Dictionary",
      members: {
        first: { type: "Text", required: false, args: { allowEmpty: true } },
        last: { type: "Text", required: false, args: { allowEmpty: true } }
      },
      required: false
    },

    issueDate: { type: "ISODate", required: false },
    canonicalUrl: { type: "Text", required: false, args: { allowEmpty: true } },
    tags: {
      type: "List",
      of: {
        type: "Text",
        required: true
      },
      args: { allowEmpty: true },
      required: false
    },
    categories: {
      type: "List",
      of: {
        type: "Text",
        required: true
      },
      args: { allowEmpty: true },
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
      args: { allowEmpty: true },
      of: {
        type: "Dictionary",
        required: true,
        members: {
          first: { type: "Text", required: false, args: { allowEmpty: true } },
          last: { type: "Text", required: false, args: { allowEmpty: true } }
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

mod.test("relationships - published", (assert, { toJSON }) => {
  assert.deepEqual(
    toJSON(Related),
    {
      fields: {
        first: {
          type: "SingleLine",
          required: false,
          args: { allowEmpty: true }
        },
        last: { type: "Text", required: false, args: { allowEmpty: true } },
        person: {
          type: "Pointer",
          kind: "hasOne",
          required: true,
          of: {
            alias: "SimpleArticle",
            required: true
          }
        },
        articles: {
          type: "Iterator",
          kind: "hasMany",
          required: false,
          of: {
            alias: "MediumArticle",
            required: true
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
});

mod.test("relationships - draft", (assert, { registry, toJSON }) => {
  assert.deepEqual(
    toJSON(Related.with({ draft: true, registry })),

    {
      fields: {
        first: { type: "Text", required: false, args: { allowEmpty: true } },
        last: { type: "Text", required: false, args: { allowEmpty: true } },
        person: {
          type: "Pointer",
          kind: "hasOne",
          required: false,
          of: {
            alias: "SimpleArticle",
            required: true
          }
        },
        articles: {
          type: "Iterator",
          kind: "hasMany",
          required: false,
          of: {
            alias: "MediumArticle",
            required: true
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
