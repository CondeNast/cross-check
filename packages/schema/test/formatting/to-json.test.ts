import { setupSchemaTest, subject, teardownSchemaTest } from "../support";

describe("[schema] formatting - toJSON", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("simple - published", () => {
    const { format } = subject();
    expect(format.published.toJSON("SimpleArticle")).toMatchSnapshot();
  });

  test("simple - draft", () => {
    const { format } = subject();
    expect(format.draft.toJSON("SimpleArticle")).toMatchSnapshot();
  });

  test("detailed - published", () => {
    const { format } = subject();
    expect(format.published.toJSON("MediumArticle")).toMatchSnapshot();
  });

  test("detailed - draft", () => {
    const { format } = subject();
    expect(format.draft.toJSON("MediumArticle")).toMatchSnapshot();
  });

  test("relationships - published", () => {
    const { format } = subject();
    expect(
      format.published.toJSON("Related")
    ).toMatchSnapshot();
  });

  test("relationships - draft", () => {
    const { format } = subject();
    expect(
      format.draft.toJSON("Related")
    ).toMatchSnapshot();
  });
});
