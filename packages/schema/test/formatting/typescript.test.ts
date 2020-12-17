import { subject, setupSchemaTest, teardownSchemaTest} from "../support";

describe("[schema] formatting - typescript", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("simple - published", () => {
    const { format } = subject();
    expect(
      format.published.typescript("SimpleArticle", { name: "SimpleArticle" }),
    ).toMatchSnapshot();
  });

  test("simple - draft", () => {
    const { format } = subject();
    expect(
      format.draft.typescript("SimpleArticle", {
        name: "SimpleArticleDraft"
      }),
    ).toMatchSnapshot();
  });

  test("detailed - published", () => {
    const { format } = subject();
    expect(
      format.published.typescript("MediumArticle", { name: "MediumArticle" }),
    ).toMatchSnapshot();
  });
});