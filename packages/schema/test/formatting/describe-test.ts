import { describe } from "@cross-check/schema";
import { strip } from "../support";
import {
  MediumArticle,
  Nesting,
  Related,
  SimpleArticle
} from "../support/records";

QUnit.module("[schema] formatting - describe");

QUnit.test("simple", assert => {
  assert.equal(
    describe(SimpleArticle),

    strip`
      {
        hed: <single line string>,
        dek?: <string>,
        body: <string>
      }
    `
  );

  assert.equal(
    describe(SimpleArticle.draft),

    strip`
      {
        hed?: <string>,
        dek?: <string>,
        body?: <string>
      }
    `
  );
});

QUnit.test("detailed", assert => {
  assert.equal(
    describe(MediumArticle),

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
        }
      }
    `
  );

  assert.equal(
    describe(MediumArticle.draft),

    strip`
      {
        hed?: <string>,
        dek?: <string>,
        body?: <string>,
        author?: {
          first?: <string>,
          last?: <string>
        },
        issueDate?: <ISO Date>,
        canonicalUrl?: <string>,
        tags?: list of <string>,
        categories?: list of <string>,
        geo?: {
          lat?: <integer>,
          long?: <integer>
        },
        contributors?: list of {
          first?: <string>,
          last?: <string>
        }
      }
    `
  );
});

QUnit.test("relationships", assert => {
  assert.equal(
    describe(Related),

    strip`
      {
        first?: <single line string>,
        last?: <string>,
        person: has one SimpleArticle,
        articles?: has many MediumArticle
      }
    `
  );

  assert.equal(
    describe(Related.draft),

    strip`
      {
        first?: <string>,
        last?: <string>,
        person?: has one SimpleArticle,
        articles?: has many MediumArticle
      }
    `
  );
});

QUnit.test("nested", assert => {
  assert.equal(
    describe(Nesting),

    strip`
      {
        people: list of {
          first?: <single line string>,
          last?: <string>
        }
      }
    `
  );

  assert.equal(
    describe(Nesting.draft),

    strip`
      {
        people?: list of {
          first?: <string>,
          last?: <string>
        }
      }
    `
  );
});
