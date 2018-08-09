import { listTypes } from "@cross-check/schema";
import { MediumArticle, SimpleArticle } from "../support/records";

QUnit.module("[schema] formatting - listTypes");

QUnit.test("simple", assert => {
  assert.deepEqual(listTypes(SimpleArticle), ["SingleLine", "Text"]);
});

QUnit.test("detailed", assert => {
  assert.deepEqual(listTypes(MediumArticle), [
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
