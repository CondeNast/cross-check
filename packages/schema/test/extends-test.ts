import { types } from "@cross-check/schema";
import { module, validateDraft } from "./support";
import { SimpleArticle } from "./support/records";

const mod = module("[schema] - extending schema");

mod.test(
  "records can be extended by copying fields",
  async (assert, { registry }) => {
    let ExtendedRecord = SimpleArticle.extend({
      fields: {
        byline: types.SingleLine()
      }
    });

    assert.deepEqual(
      await validateDraft(ExtendedRecord, registry, {
        hed: null,
        dek: null,
        body: null,
        byline: null
      }),
      [],
      "extended record can be validated as draft"
    );
  }
);
