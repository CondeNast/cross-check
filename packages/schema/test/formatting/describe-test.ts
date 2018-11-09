import { module, strip } from "../support";

const mod = module("[schema] formatting - describe");

mod.test("simple", (assert, { format }) => {
  assert.equal(
    format.published.describe("SimpleArticle"),

    strip`
      {
        hed: <single line string>,
        dek?: <string>,
        body: <string>,
        issueDate?: <ISO Date>
      }
    `
  );

  // assert.equal(
  //   describe(SimpleArticle.draft),

  //   strip`
  //     {
  //       hed?: <string>,
  //       dek?: <string>,
  //       body?: <string>
  //     }
  //   `
  // );
});

mod.test("detailed", (assert, { format }) => {
  assert.equal(
    format.published.describe("MediumArticle"),

    strip`
      {
        hed: <single line string>,
        dek?: <string>,
        body: <string>,
        author?: {
          first?: <single line string>,
          last?: <single line string>
        },
        issueDate?: <ISO Date>,
        canonicalUrl?: <url>,
        tags?: list of <single word string>,
        categories: list of <single line string>,
        geo?: {
          lat: <integer>,
          long: <integer>
        },
        contributors?: list of {
          first?: <single line string>,
          last?: <single line string>
        },
        relatedArticles?: has many MediumArticle
      }
    `
  );

  // assert.equal(
  //   describe(MediumArticle.draft),

  //   strip`
  //     {
  //       hed?: <string>,
  //       dek?: <string>,
  //       body?: <string>,
  //       author?: {
  //         first?: <string>,
  //         last?: <string>
  //       },
  //       issueDate?: <ISO Date>,
  //       canonicalUrl?: <string>,
  //       tags?: list of <string>,
  //       categories?: list of <string>,
  //       geo?: {
  //         lat?: <integer>,
  //         long?: <integer>
  //       },
  //       contributors?: list of {
  //         first?: <string>,
  //         last?: <string>
  //       }
  //     }
  //   `
  // );
});

mod.test("relationships", (assert, { format }) => {
  assert.equal(
    format.published.describe("Related"),

    strip`
      {
        first?: <single line string>,
        last?: <string>,
        person: has one SimpleArticle,
        articles?: has many MediumArticle
      }
    `
  );

  // assert.equal(
  //   describe(Related.draft),

  //   strip`
  //     {
  //       first?: <string>,
  //       last?: <string>,
  //       person?: has one SimpleArticle,
  //       articles?: has many MediumArticle
  //     }
  //   `
  // );
});

mod.test("nested", (assert, { format }) => {
  assert.equal(
    format.published.describe("Nesting"),

    strip`
      {
        people: list of {
          first?: <single line string>,
          last?: <string>
        }
      }
    `
  );

  // assert.equal(
  //   describe(Nesting.draft),

  //   strip`
  //     {
  //       people?: list of {
  //         first?: <string>,
  //         last?: <string>
  //       }
  //     }
  //   `
  // );
});
