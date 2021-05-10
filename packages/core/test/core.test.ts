import { ValidationDescriptor, format } from "@condenast/cross-check";

function desc(name: string, options: unknown = null): ValidationDescriptor {
  return {
    name,
    validator: () => null as any,
    options,
    contexts: [],
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
    contexts,
  };
}

describe("format", () => {
  test.each([
    [null, "(call)"],
    [undefined, "(call)"],
    [[undefined], "(call undefined)"],
    [[null], "(call null)"],
    [[() => null], "(call function() { ... })"],
    [[class X {}], "(call class X { ... })"],
    [[/hello world/i], "(call /hello world/i)"],
    [[{}], "(call {})"],
    [{ hello: {} }, "(call hello={})"],
    [[new Set()], "(call [unknown])"],
    [{ x: null, y: undefined }, "(call x=null y=undefined)"],
    [["some", "string"], `(call "some" "string")`],
    [[desc("string"), desc("url")], `(call (string) (url))`],
    [
      [desc("url", { absolute: true }), desc("present")],
      "(call (url absolute=true) (present))",
    ],
    [
      [desc("present"), desc("number", { min: 1, max: 4 })],
      "(call (present) (number min=1 max=4))",
    ],
    [[descOn(["create"], "str")], `(call (str)::on(create))`],
  ])("formatting a descriptor %p", (options: unknown, expected: string) => {
    expect(format(desc("call", options))).toEqual(expected);
  });
});
