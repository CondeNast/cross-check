import { toJSON } from "@cross-check/schema";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

QUnit.module("[schema] formatting - toJSON");

QUnit.test("simple - published", assert => {
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

QUnit.test("simple - draft", assert => {
  assert.deepEqual(toJSON(SimpleArticle.draft), {
    fields: {
      hed: { type: "Text", required: false, args: { allowEmpty: true } },
      dek: { type: "Text", required: false, args: { allowEmpty: true } },
      body: { type: "Text", required: false, args: { allowEmpty: true } }
    },
    metadata: undefined
  });
});

QUnit.test("detailed - published", assert => {
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

QUnit.test("detailed - draft", assert => {
  let actual = toJSON(MediumArticle.draft);
  let fields = {
    hed: { type: "Text", required: false, args: { allowEmpty: true } },
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
    metadata: undefined
  };

  assert.deepEqual(actual, expected);
});

QUnit.test("relationships", assert => {
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

  // assert.deepEqual(
  //   toJSON(Related.draft),

  //   {
  //     fields: {
  //       first: { type: "Text", required: false, args: { allowEmpty: true } },
  //       last: { type: "Text", required: false, args: { allowEmpty: true } },
  //       person: {
  //         type: "Pointer",
  //         kind: "hasOne",
  //         required: false,
  //         of: {
  //           alias: "SimpleArticle",
  //           required: true
  //         }
  //       },
  //       articles: {
  //         type: "Iterator",
  //         kind: "hasMany",
  //         required: false,
  //         of: {
  //           alias: "MediumArticle",
  //           required: true
  //         }
  //       }
  //     },
  //     metadata: {
  //       collectionName: "related-articles",
  //       modelName: "related-article"
  //     }
  //   },
  //   "Related.draft"
  // );
});
