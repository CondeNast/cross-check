import { module } from "../support";

const mod = module("[schema] formatting - listTypes");

mod.test("simple", (assert, { env }) => {
  assert.deepEqual(env.published.listTypes("SimpleArticle"), [
    "ISODate",
    "SingleLine",
    "Text"
  ]);
});

mod.test("simple - draft", (assert, { env }) => {
  assert.deepEqual(env.draft.listTypes("SimpleArticle"), ["ISODate", "Text"]);
});

mod.test("detailed", (assert, { env }) => {
  assert.deepEqual(env.published.listTypes("MediumArticle"), [
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

mod.test("detailed - draft", (assert, { env }) => {
  assert.deepEqual(env.draft.listTypes("MediumArticle"), [
    "Dictionary",
    "ISODate",
    "Integer",
    "List",
    "MediumArticle",
    "Text"
  ]);
});
