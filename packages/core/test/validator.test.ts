import { validate, validator } from "@condenast/cross-check";

describe("validator", () => {
  test("void options using the synchronous API", async () => {
    const isAllCaps = validator("is-all-caps", () => (input: string) =>
      input.toUpperCase() === input
    );

    expect(await validate("hello", isAllCaps())).toEqual([
      {
        path: [],
        message: {
          name: "is-all-caps",
          details: null,
        },
      },
    ]);

    expect(await validate("Hello", isAllCaps())).toEqual([
      {
        path: [],
        message: {
          name: "is-all-caps",
          details: null,
        },
      },
    ]);

    expect(await validate("HELLO", isAllCaps())).toEqual([]);
  });

  test("with options using the synchronous API", async () => {
    const lt = validator("lt", (upperBound: number) => (input: number) =>
      input < upperBound
    );

    expect(await validate(5, lt(5))).toEqual([
      {
        path: [],
        message: {
          name: "lt",
          details: 5,
        },
      },
    ]);

    expect(await validate(6, lt(5))).toEqual([
      {
        path: [],
        message: {
          name: "lt",
          details: 5,
        },
      },
    ]);

    expect(await validate(4, lt(5))).toEqual([]);
  });
});
