import { ValidationError, format } from "@cross-check/core";
import validates, { BasicValidator, builderFor } from "@cross-check/dsl";
import { Indexable } from "ts-std";
import { buildAndRun as run } from "../support";

function isNotBlank(str: unknown): boolean {
  return typeof str === "string" && str.trim() !== "";
}

function hasPackageName({ name }: Indexable): boolean {
  return isNotBlank(name);
}

function hasAuthor({ author }: Indexable): boolean {
  return isNotBlank(author);
}

function hasContributors({ contributors }: Indexable): boolean {
  return Array.isArray(contributors) && contributors.length > 0;
}

describe("Validators (basic)", () => {

  test("PackageJSONValidator", async () => {
    class PackageJSONValidator extends BasicValidator<Indexable> {
      static validatorName = "package-json";

      validate(json: Indexable): ValidationError[] {
        let errors = [];

        if (!hasPackageName(json)) {
          errors.push({
            path: ["name"],
            message: {
              name: "required",
              details: undefined
            }
          });
        }

        if (!hasAuthor(json) && !hasContributors(json)) {
          errors.push({
            path: [],
            message: {
              name: "authorship",
              details: undefined
            }
          });
        }

        return errors;
      }
    }

    const packageJSON = builderFor(PackageJSONValidator);

    expect(format(validates(packageJSON()))).toEqual(`(package-json)`);

    function success(): ValidationError[] {
      return [];
    }

    function packageNameFailure(): ValidationError[] {
      return [
        {
          path: ["name"],
          message: {
            name: "required",
            details: undefined
          }
        }
      ];
    }

    function authorshipFailure(): ValidationError[] {
      return [
        {
          path: [],
          message: {
            name: "authorship",
            details: undefined
          }
        }
      ];
    }

    expect(await run(packageJSON(), {})).toEqual([
      ...packageNameFailure(),
      ...authorshipFailure()
    ]);
    expect(
      await run(packageJSON(), { name: "@cross-check/dsl" })
    ).toEqual(
      authorshipFailure()
    );
    expect(
      await run(packageJSON(), { author: "Godfrey" })
    ).toEqual(
      packageNameFailure()
    );
    expect(
      await run(packageJSON(), { contributors: ["Godfrey", "Yehuda"] })
    ).toEqual(
      packageNameFailure()
    );

    expect(
      await run(packageJSON(), { name: "@cross-check/dsl", author: "Godfrey" })
    ).toEqual(
      success()
    );
    expect(
      await run(packageJSON(), {
        name: "@cross-check/dsl",
        contributors: ["Godfrey", "Yehuda"]
      })
    ).toEqual(
      success()
    );
  });
});