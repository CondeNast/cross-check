import { module } from "../support";

const mod = module("[schema] formatting - listTypes");

mod.test("simple", (assert, { std }) => {
  assert.deepEqual(std.published.listTypes("SimpleArticle"), [
    "SingleLine",
    "Text"
  ]);
});

mod.test("simple - draft", (assert, { std }) => {
  assert.deepEqual(std.draft.listTypes("SimpleArticle"), ["Text"]);
});

mod.test("detailed", (assert, { std }) => {
  assert.deepEqual(std.published.listTypes("MediumArticle"), [
    "Dictionary",
    "ISODate",
    "Integer",
    "List",
    "SingleLine",
    "SingleWord",
    "Text",
    "Url"
  ]);
});

mod.test("detailed - draft", (assert, { std }) => {
  assert.deepEqual(std.draft.listTypes("MediumArticle"), [
    "Dictionary",
    "ISODate",
    "Integer",
    "List",
    "Text"
  ]);
});
