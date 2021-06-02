import { subject, setupSchemaTest, teardownSchemaTest } from "../support";

describe("[schema] formatting - describe", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("simple", () => {
    let { format } = subject();
    expect(
      format.published.describe("SimpleArticle")
    ).toMatchSnapshot();
  });

  test("detailed", () => {
    let { format } = subject();
    expect(
      format.published.describe("MediumArticle")
    ).toMatchSnapshot();
  });

  test("relationships", () => {
    let { format } = subject();
    expect(
      format.published.describe("Related")
    ).toMatchSnapshot();
  });

  test("nested", () => {
    let { format } = subject();
    expect(
      format.published.describe("Nesting")
    ).toMatchSnapshot();
  });
});
