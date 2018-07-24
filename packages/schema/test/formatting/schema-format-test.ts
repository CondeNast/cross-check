import { Record, schemaFormat, types } from "@cross-check/schema";
import { ISODate, strip } from "../support";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

QUnit.module("formatting - schemaFormat");

QUnit.test("simple", assert => {
  assert.equal(
    schemaFormat(SimpleArticle),

    strip`
      Record("SimpleArticle", {
        hed: SingleLine().required(),
        dek: Text(),
        body: Text().required()
      }).metadata({
        collectionName: "simple-articles",
        modelName: "simple-article"
      })
    `
  );
});

QUnit.test("detailed - published", assert => {
  assert.equal(
    schemaFormat(MediumArticle),

    strip`
      Record("MediumArticle", {
        hed: SingleLine().required(),
        dek: Text(),
        body: Text().required(),
        author: Dictionary({
          first: SingleLine(),
          last: SingleLine()
        }),
        issueDate: ISODate(),
        canonicalUrl: Url(),
        tags: List(SingleWord()),
        categories: List(SingleLine()).required(),
        geo: Dictionary({
          lat: Integer().required(),
          long: Integer().required()
        }),
        contributors: List(Dictionary({
          first: SingleLine(),
          last: SingleLine()
        }))
      }).metadata({
        collectionName: "medium-articles",
        modelName: "medium-article"
      })
    `
  );
});

QUnit.test("required dictionaries", assert => {
  const RECORDS = Record("RequiredDictionary", {
    fields: {
      geo: types.RequiredFields({ lat: types.Float(), long: types.Float() }),
      author: types
        .RequiredFields({
          first: types.SingleLine(),
          last: types.SingleLine()
        })
        .required(),
      date: ISODate()
    }
  });

  assert.equal(
    schemaFormat(RECORDS),

    strip`
      Record("RequiredDictionary", {
        geo: Dictionary({
          lat: Float().required(),
          long: Float().required()
        }),
        author: Dictionary({
          first: SingleLine().required(),
          last: SingleLine().required()
        }).required(),
        date: ISODate()
      })
    `
  );
});

QUnit.test("relationships", assert => {
  assert.equal(
    schemaFormat(Related),

    strip`
      Record("Related", {
        first: SingleLine(),
        last: Text(),
        person: hasOne(SimpleArticle).required(),
        articles: hasMany(MediumArticle)
      }).metadata({
        collectionName: "related-articles",
        modelName: "related-article"
      })
    `
  );
});
