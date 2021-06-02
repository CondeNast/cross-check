import { ErrorMessage, ValidationError, format } from "@condenast/cross-check";
import validates from "@condenast/cross-check-dsl";
import { buildAndRun as run } from "../support";

describe("Validators (callback)", () => {
  test("isAlphaNumeric", async () => {
    function isAlphaNumeric(str: string): ErrorMessage | void {
      if (!str.match(/^[a-z0-9]+$/i)) {
        return { name: "alpha-numeric", details: undefined };
      }
    }

    function success(): ValidationError[] {
      return [];
    }

    function failure(): ValidationError[] {
      return [
        {
          path: [],
          message: {
            name: "alpha-numeric",
            details: undefined,
          },
        },
      ];
    }

    expect(format(validates(isAlphaNumeric, "is-alpha-numeric"))).toEqual(
      `(is-alpha-numeric function() { ... })`
    );

    expect(await run(isAlphaNumeric, "hello")).toEqual(success());
    expect(await run(isAlphaNumeric, "1337")).toEqual(success());
    expect(await run(isAlphaNumeric, "C0DE")).toEqual(success());

    expect(await run(isAlphaNumeric, "")).toEqual(failure());
    expect(await run(isAlphaNumeric, "hello-world")).toEqual(failure());
    expect(await run(isAlphaNumeric, "._.")).toEqual(failure());
  });
});
