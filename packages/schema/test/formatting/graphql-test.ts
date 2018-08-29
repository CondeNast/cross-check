import { GRAPHQL_SCALAR_MAP, module, strip } from "../support";
import { MediumArticle, Related, SimpleArticle } from "../support/records";

let mod = module("[schema] formatting - graphql");

mod.test("simple", (assert, { registry, graphql }) => {
  assert.equal(
    graphql(SimpleArticle, { name: "Simple", scalarMap: GRAPHQL_SCALAR_MAP }),
    strip`
      type Simple {
        hed: SingleLine!
        dek: String
        body: String!
      }
    `
  );

  assert.equal(
    graphql(SimpleArticle.with({ draft: true, registry }), {
      name: "Simple",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),
    strip`
      type Simple {
        hed: String
        dek: String
        body: String
      }
    `
  );
});

mod.test("detailed", (assert, { graphql }) => {
  assert.equal(
    graphql(MediumArticle, {
      name: "MediumArticle",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),

    strip`
    type MediumArticleAuthor {
      first: SingleLine
      last: SingleLine
    }

    type MediumArticleGeo {
      lat: Int!
      long: Int!
    }

    type MediumArticleContributors {
      first: SingleLine
      last: SingleLine
    }

    type MediumArticle {
      hed: SingleLine!
      dek: String
      body: String!
      author: MediumArticleAuthor
      issueDate: ISODate
      canonicalUrl: Url
      tags: [SingleWord!]
      categories: [SingleLine!]!
      geo: MediumArticleGeo
      contributors: [MediumArticleContributors!]
    }
    `
  );
});

mod.test("relationships", (assert, { graphql }) => {
  assert.equal(
    graphql(Related, { name: "Related", scalarMap: GRAPHQL_SCALAR_MAP }),

    strip`
      type Related {
        first: SingleLine
        last: String
        person: SimpleArticle!
        articles: [MediumArticle!]
      }
    `
  );
});

// QUnit.skip("pagination with Relay Cursors", assert => {
//   assert.equal(
//     graphql(Bundle, { name: "Bundle", scalarMap: GRAPHQL_SCALAR_MAP }),

//     strip`
//       type SimpleArticleEdge {
//         cursor: Cursor
//         node: SimpleArticle
//       }

//       type SimpleArticlePage {
//         edges: SimpleArticleEdge
//         pageInfo: PageInfo
//       }

//       type Bundle {
//         name: SingleLine
//         articles: SimpleArticlePage!
//       }
//     `
//   );
// });
