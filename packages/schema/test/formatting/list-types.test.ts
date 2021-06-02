import { subject, setupSchemaTest, teardownSchemaTest } from "../support";

describe("[schema] formatting - listTypes", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("simple", () => {
    const { env } = subject();
    expect(env.published.listTypes("SimpleArticle")).toEqual(
      [
        "SingleLine",
        "Text"
      ]);
  });

  test("simple - draft", () => {
    const { env } = subject();
    expect(env.draft.listTypes("SimpleArticle")).toEqual(
      ["Text"]);
  });

  test("detailed", () => {
    const { env } = subject();
    expect(env.published.listTypes("MediumArticle")).toEqual(
      [
        "Dictionary",
        "ISODate",
        "Integer",
        "List",
        "MediumArticle",
        "SingleLine",
        "SingleWord",
        "Text",
        "Url"
      ]);
  });

  test("detailed - draft", () => {
    const { env } = subject();
    expect(env.draft.listTypes("MediumArticle")).toEqual(
      [
        "Dictionary",
        "ISODate",
        "Integer",
        "List",
        "MediumArticle",
        "Text"
      ]);
  });
});
