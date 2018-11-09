import { module, strip } from "../support";

const mod = module("[schema] formatting - typescript");

mod.test("simple - published", (assert, { format }) => {
  assert.equal(
    format.published.typescript("SimpleArticle", { name: "SimpleArticle" }),

    strip`
        export interface SimpleArticle {
          hed: string;
          dek?: string;
          body: string;
          issueDate?: Date;
        }
      `
  );
});

mod.test("simple - draft", (assert, { format }) => {
  assert.equal(
    format.draft.typescript("SimpleArticle", {
      name: "SimpleArticleDraft"
    }),

    strip`
        export interface SimpleArticleDraft {
          hed?: string;
          dek?: string;
          body?: string;
          issueDate?: Date;
        }
      `
  );
});

mod.test("detailed - published", (assert, { format }) => {
  assert.equal(
    format.published.typescript("MediumArticle", { name: "MediumArticle" }),

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
        relatedArticles?: Array<MediumArticle>;
      }
    `
  );
});

mod.test("detailed - draft", (assert, { format }) => {
  assert.equal(
    format.draft.typescript("MediumArticle", {
      name: "MediumArticleDraft"
    }),

    strip`
      export interface MediumArticleDraft {
        hed: string;
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
        relatedArticles?: Array<MediumArticle>;
      }
    `
  );
});
