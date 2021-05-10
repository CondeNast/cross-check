import { types } from "@condenast/cross-check-schema";
import {
  setupSchemaTest,
  teardownSchemaTest,
  subject,
  validateDraft,
} from "./support";
import { SimpleArticle } from "./support/records";

describe("[schema] - extending schema", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("records can be extended by copying fields", async () => {
    const { registry } = subject();
    const ExtendedRecord = SimpleArticle.merge({
      fields: {
        byline: types.SingleLine(),
      },
    });

    expect(
      await validateDraft(ExtendedRecord, registry, {
        hed: null,
        dek: null,
        body: null,
        byline: null,
      })
    ).toEqual([]);
  });

  test("records can be extended by removing fields", async () => {
    const ExtendedRecord = SimpleArticle.merge({
      remove: ["hed"],
    });

    expect(ExtendedRecord.members.members.hed).toBeFalsy();
  });
});
