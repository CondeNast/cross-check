import { listTypes } from "@cross-check/schema";
import { module } from "../support";
import { MediumArticle, SimpleArticle } from "../support/records";

const mod = module("[schema] formatting - listTypes");

mod.test("simple", (assert, { registry }) => {
  assert.deepEqual(listTypes(SimpleArticle, registry), ["SingleLine", "Text"]);
});

mod.test("detailed", (assert, { registry }) => {
  assert.deepEqual(listTypes(MediumArticle, registry), [
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
