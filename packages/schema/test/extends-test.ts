import { types } from "@cross-check/schema";
import { module, validateDraft } from "./support";
import { SimpleArticle } from "./support/records";

const mod = module("[schema] - extending schema");

mod.test(
  "records can be extended by copying fields",
  async (assert, { registry }) => {
    let ExtendedRecord = SimpleArticle.merge({
      fields: {
        byline: types.SingleLine()
      }
    });

    assert.deepEqual(
      await validateDraft(ExtendedRecord, registry, {
        hed: null,
        dek: null,
        body: null,
        issueDate: null,
        byline: null
      }),
      [],
      "extended record can be validated as draft"
    );
  }
);

mod.test("records can be extended by removing fields", async assert => {
  let ExtendedRecord = SimpleArticle.merge({
    remove: ["hed"]
  });

  assert.notOk(
    ExtendedRecord.members.members.hed,
    "extended record does not have removed field in members"
  );
});
