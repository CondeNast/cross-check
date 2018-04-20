import { format } from "@cross-check/core";
import { unknown } from "ts-std";
import { ValidationDescriptor } from "./index";

QUnit.module("format");

QUnit.test("formatting a basic validation descriptor", assert => {
  assert.equal(format(desc("call", null)), "(call)");

  assert.equal(format(desc("call", undefined)), "(call)");

  assert.equal(
    format(desc("call", ["some", "string"])),
    `(call "some" "string")`
  );

  assert.equal(
    format(desc("or", [desc("string"), desc("url")])),
    "(or (string) (url))"
  );

  assert.equal(
    format(desc("or", [desc("url", { absolute: true }), desc("present")])),
    "(or (url absolute=true) (present))"
  );

  assert.equal(
    format(
      desc("andThen", [desc("present"), desc("number", { min: 1, max: 4 })])
    ),
    "(andThen (present) (number min=1 max=4))"
  );
});

function desc(name: string, options: unknown = null): ValidationDescriptor {
  return {
    name,
    factory: () => null as any,
    options,
    contexts: []
  };
}
