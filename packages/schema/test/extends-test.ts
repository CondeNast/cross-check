import {
  Record,
  types
} from "@cross-check/schema";
import {
  module,
  validateDraft
} from "./support";
import { SimpleArticle } from "./support/records";

const mod = module("[schema] - extending schema");

mod.test(
  "records can be extended by copying fields",
  async (assert, { registry }) => {
    let members = SimpleArticle.members.members;
    let newFields: any = {
      byline: types.SingleLine()
    }
    let ExtendedRecord = Record("SimpleArticle", {
      fields: Object.assign({}, members, newFields),
      metadata: SimpleArticle.metadata
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
