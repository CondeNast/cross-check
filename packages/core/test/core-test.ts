import { ValidationDescriptor, format } from "@cross-check/core";

QUnit.module("@cross-check/core format");

function assertFormat(
  assert: typeof QUnit.assert
): (options: unknown, expected: string, contexts?: string[]) => void {
  return (options, expected, contexts?) => {
    let d = contexts
      ? descOn(contexts, "call", options)
      : desc("call", options);

    let formatted = format(d);

    assert.equal(formatted, expected, `${quickFormat(options)}`);
  };
}

function quickFormat(o: unknown): string {
  if (Array.isArray(o)) {
    return `[${o.map(quickFormat).join(", ")}]`;
  } else {
    return String(o);
  }
}

QUnit.test("formatting a basic validation descriptor", assert => {
  const expectFormat = assertFormat(assert);

  expectFormat(null, "(call)");
  expectFormat(undefined, "(call)");
  expectFormat([undefined], "(call undefined)");
  expectFormat([null], "(call null)");
  expectFormat([() => null], "(call function() { ... })");
  expectFormat([class X {}], "(call class X { ... })");
  expectFormat([/hello world/i], "(call /hello world/i)");
  expectFormat([{}], "(call {})");
  expectFormat({ hello: {} }, "(call hello={})");
  expectFormat([new Set()], "(call [unknown])");
  expectFormat({ x: null, y: undefined }, "(call x=null y=undefined)");
  expectFormat(["some", "string"], `(call "some" "string")`);
  expectFormat([desc("string"), desc("url")], `(call (string) (url))`);
  expectFormat(
    [desc("url", { absolute: true }), desc("present")],
    "(call (url absolute=true) (present))"
  );
  expectFormat(
    [desc("present"), desc("number", { min: 1, max: 4 })],
    "(call (present) (number min=1 max=4))"
  );

  expectFormat([descOn(["create"], "str")], `(call (str)::on(create))`);
});

function desc(name: string, options: unknown = null): ValidationDescriptor {
  return {
    name,
    validator: () => null as any,
    options,
    contexts: []
  };
}

function descOn(
  contexts: string[],
  name: string,
  options: unknown = null
): ValidationDescriptor {
  return {
    name,
    validator: () => null as any,
    options,
    contexts
  };
}
