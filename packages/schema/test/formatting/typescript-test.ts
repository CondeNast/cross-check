import { typescript } from "@cross-check/schema";
import { strip } from "../support";
import { MediumArticle, SimpleArticle } from "../support/records";

QUnit.module("[schema] formatting - typescript");

QUnit.test("simple - published", assert => {
  assert.equal(
    typescript(SimpleArticle, { name: "SimpleArticle" }),

    strip`
        export interface SimpleArticle {
          hed: string;
          dek?: string;
          body: string;
        }
      `
  );
});

QUnit.test("simple - draft", assert => {
  assert.equal(
    typescript(SimpleArticle.draft, { name: "SimpleArticleDraft" }),

    strip`
        export interface SimpleArticleDraft {
          hed?: string;
          dek?: string;
          body?: string;
        }
      `
  );
});

QUnit.test("detailed - published", assert => {
  assert.equal(
    typescript(MediumArticle, { name: "MediumArticle" }),

    strip`
      export interface MediumArticle {
        hed: string;
        dek?: string;
        body: string;
        author?: {
          first?: string;
          last?: string;
        };
        issueDate?: Date;
        canonicalUrl?: URL;
        tags?: Array<string>;
        categories: Array<string>;
        geo?: {
          lat: number;
          long: number;
        };
        contributors?: Array<{
          first?: string;
          last?: string;
        }>;
      }
    `
  );
});

QUnit.test("detailed - draft", assert => {
  assert.equal(
    typescript(MediumArticle.draft, { name: "MediumArticleDraft" }),

    strip`
      export interface MediumArticleDraft {
        hed?: string;
        dek?: string;
        body?: string;
        author?: {
          first?: string;
          last?: string;
        };
        issueDate?: Date;
        canonicalUrl?: string;
        tags?: Array<string>;
        categories?: Array<string>;
        geo?: {
          lat?: number;
          long?: number;
        };
        contributors?: Array<{
          first?: string;
          last?: string;
        }>;
      }
    `
  );
});
