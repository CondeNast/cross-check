import { subject, setupSchemaTest, teardownSchemaTest } from "../support";

describe("[schema] formatting - schemaFormat", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("simple", () => {
    let { format } = subject();
    expect(
      format.published.schemaFormat("SimpleArticle"),
    ).toMatchSnapshot();
  });

  test("detailed - published", () => {
    let { format } = subject();
    expect(
      format.published.schemaFormat("MediumArticle"),
    ).toMatchSnapshot();
  });

  test("relationships", () => {
    let { format } = subject();
    expect(
      format.published.schemaFormat("Related"),
    ).toMatchSnapshot();
  });
});
