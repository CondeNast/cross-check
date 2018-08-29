import { module, strip } from "../support";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

const mod = module("[schema] formatting - schemaFormat");

mod.test("simple", (assert, { schemaFormat }) => {
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

mod.test("detailed - published", (assert, { schemaFormat }) => {
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

mod.test("relationships", (assert, { schemaFormat }) => {
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
