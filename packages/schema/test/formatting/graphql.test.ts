import { GRAPHQL_SCALAR_MAP, subject, setupSchemaTest, teardownSchemaTest } from "../support";

describe("[schema] formatting - graphql", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("simple", () => {
    let { format } = subject();
    expect(
      format.published.graphql("SimpleArticle", {
        name: "Simple",
        scalarMap: GRAPHQL_SCALAR_MAP
      })
    ).toMatchSnapshot();

    expect(
      format.draft.graphql("SimpleArticle", {
        name: "Simple",
        scalarMap: GRAPHQL_SCALAR_MAP
      })
    ).toMatchSnapshot();
  });

  test("detailed", () => {
    let { format } = subject();
    expect(
      format.published.graphql("MediumArticle", {
        name: "MediumArticle",
        scalarMap: GRAPHQL_SCALAR_MAP
      })
    ).toMatchSnapshot()
  });

  test("relationships", () => {
    let { format } = subject();
    expect(
      format.published.graphql("Related", {
        name: "Related",
        scalarMap: GRAPHQL_SCALAR_MAP
      })
    ).toMatchSnapshot();
  });
});
