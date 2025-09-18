import { ErrorMessage, ValidationError } from "@condenast/cross-check";
import {
  ValueValidator,
  builderFor,
  validators,
} from "@condenast/cross-check-dsl";
import { buildAndRun as run } from "../support";

describe("Validators (value)", () => {
  test("FormatValidator", async () => {
    class FormatValidator extends ValueValidator<string, RegExp> {
      static validatorName = "format";

      validate(value: string): ErrorMessage | void {
        if (!value.match(this.options)) {
          return { name: "format", details: this.options };
        }
      }
    }

    const format = builderFor(FormatValidator);

    const EMAIL_REGEX = /^([^\s]+)@([^\s]+){2,}\.([^\s]+){2,}$/;

    function success(): ValidationError[] {
      return [];
    }

    function emailFailure(): ValidationError[] {
      return [
        {
          path: [],
          message: {
            name: "format",
            details: EMAIL_REGEX,
          },
          level: "error",
        },
      ];
    }

    function stringFailure(): ValidationError[] {
      return [
        {
          path: [],
          message: {
            name: "type",
            details: "string",
          },
          level: "error",
        },
      ];
    }

    let email = validators
      .isString()
      .andThen(format(/^([^\s]+)@([^\s]+){2,}\.([^\s]+){2,}$/));

    expect(await run(email, null)).toEqual(stringFailure());
    expect(await run(email, "dan")).toEqual(emailFailure());
    expect(await run(email, "dan@example.com")).toEqual(success());
  });
});
