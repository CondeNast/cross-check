import { schemaFormat } from "@cross-check/schema";
import { strip } from "../support";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

QUnit.module("[schema] formatting - schemaFormat");

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
