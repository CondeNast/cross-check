import { module, strip } from "../support";
import { MediumArticle, SimpleArticle } from "../support/records";

const mod = module("[schema] formatting - typescript");

mod.test("simple - published", (assert, { typescript }) => {
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

mod.test("simple - draft", (assert, { registry, typescript }) => {
  assert.equal(
    typescript(SimpleArticle.with({ draft: true, registry }), {
      name: "SimpleArticleDraft"
    }),

    strip`
        export interface SimpleArticleDraft {
          hed?: string;
          dek?: string;
          body?: string;
        }
      `
  );
});

mod.test("detailed - published", (assert, { typescript }) => {
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

mod.test("detailed - draft", (assert, { registry, typescript }) => {
  assert.equal(
    typescript(MediumArticle.with({ draft: true, registry }), {
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
      }
    `
  );
});
