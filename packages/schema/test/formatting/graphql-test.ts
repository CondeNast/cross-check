import { GRAPHQL_SCALAR_MAP, module, strip } from "../support";

let mod = module("[schema] formatting - graphql");

mod.test("simple", (assert, { format }) => {
  assert.equal(
    format.published.graphql("SimpleArticle", {
      name: "Simple",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),
    strip`
      type Simple {
        hed: SingleLine!
        dek: String
        body: String!
        issueDate: ISODate
      }
    `
  );

  assert.equal(
    format.draft.graphql("SimpleArticle", {
      name: "Simple",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),
    strip`
      type Simple {
        hed: String
        dek: String
        body: String
        issueDate: ISODate
      }
    `
  );
});

mod.test("detailed", (assert, { format }) => {
  assert.equal(
    format.published.graphql("MediumArticle", {
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
      relatedArticles: [MediumArticle!]
    }
    `
  );
});

mod.test("relationships", (assert, { format }) => {
  assert.equal(
    format.published.graphql("Related", {
      name: "Related",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),

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
