import { ValidationError } from "@condenast/cross-check";
import {
  REGISTRY,
  Record,
  builders,
  dehydrated,
  types,
} from "@condenast/cross-check-schema";
import {
  ENV,
  keysError,
  missingError,
  setupSchemaTest,
  teardownSchemaTest,
  subject,
  typeError,
  validate,
} from "./support";
import { Features, resolve } from "./support/records";

describe("[schema] - record with feature flags", () => {
  beforeEach(setupSchemaTest);
  afterEach(teardownSchemaTest);

  test("all feature-flagged fields are optional in draft mode", async () => {
    const { registry } = subject();
    expect(
      await validate(
        Features.with({
          registry,
          features: ["category-picker", "description", "map"],
          draft: true,
        }),
        {
          hed: null,
          dek: null,
          categories: null,
          description: null,
          location: null,
        }
      )
    ).toEqual([]);
  });

  test("all feature-flagged fields are present in published mode if present", async () => {
    const { registry } = subject();
    expect(
      await validate(
        Features.with({
          registry,
          features: ["category-picker", "description", "map"],
          draft: true,
        }),
        {
          hed: "Hello world",
          dek: "Hello, the cool world!",
          categories: null,
          description: null,
          location: null,
        }
      )
    ).toEqual([]);
  });

  interface TestCase {
    type: builders.TypeBuilder;
    success: unknown;
    cases: Array<{
      value: unknown | null | undefined;
      errors?: ValidationError[];
      draftErrors?: ValidationError[];
    }>;
  }

  interface RowOptions {
    required: boolean[] | true | false | "any";
    draft: boolean[] | true | false | "any";
    flagged: Array<"on" | "off"> | "on" | "off" | "any";
  }

  interface ValuesRow extends RowOptions {
    failures: Array<unknown | null | undefined>;
  }

  interface ValueRow extends RowOptions {
    success: Array<unknown | null | undefined>;
  }

  type Row = ValueRow | ValuesRow;

  interface RowMatch {
    required: boolean;
    draft: boolean;
    flagged: boolean;
    value: MatchValue;
  }

  class RowMatches {
    private matches: Map<
      boolean,
      Map<boolean, Map<boolean, Set<MatchValue>>>
    > = new Map();

    add(match: RowMatch): void {
      let required = this.matches.get(match.required);

      if (!required) {
        required = new Map();
        this.matches.set(match.required, required);
      }

      let draft = required.get(match.draft);

      if (!draft) {
        draft = new Map();
        required.set(match.draft, draft);
      }

      let flagged = draft.get(match.flagged);

      if (!flagged) {
        flagged = new Set();
        draft.set(match.flagged, flagged);
      }

      flagged.add(match.value);
    }

    has(match: RowMatch): boolean {
      const required = this.matches.get(match.required);

      if (!required) {
        return false;
      }

      const draft = required.get(match.draft);

      if (!draft) {
        return false;
      }

      const flagged = draft.get(match.flagged);

      if (!flagged) {
        return false;
      }

      return flagged.has(match.value);
    }
  }

  type MatchValue = "null" | "missing" | "success" | "failure";

  function rowMatch(row: Row): RowMatch[] {
    const requiredValues = normalize(row.required, [true, false]);
    const draftValues = normalize(row.draft, [true, false]);
    const flaggedValues = normalize(row.flagged, ["on", "off"]).map(
      (v) => v === "on"
    );

    const values: MatchValue[] = [];

    if ("success" in row) {
      values.push(
        ...row.success.map((r) => {
          if (r === null) return "null";
          else if (r === undefined) return "missing";
          else return "success";
        })
      );
    } else {
      values.push(
        ...row.failures.map((r) => {
          if (r === null) return "null";
          else if (r === undefined) return "missing";
          else return "failure";
        })
      );
    }

    const matches: RowMatch[] = [];

    requiredValues.forEach((required) =>
      draftValues.forEach((draft) =>
        flaggedValues.forEach((flagged) =>
          values.forEach((value) =>
            matches.push({
              required,
              draft,
              flagged,
              value,
            })
          )
        )
      )
    );

    return matches;
  }

  function normalize<T>(maybeAny: T[] | T | "any", defaultValue: T[]): T[] {
    if (maybeAny === "any") {
      return defaultValue;
    } else if (Array.isArray(maybeAny)) {
      return maybeAny;
    } else {
      return [maybeAny];
    }
  }

  async function testType(options: TestCase) {
    /**
     * Matrix:
     *
     * Required / Optional
     * Flagged On / Flagged Off
     * Draft / Published
     * Missing / Null / Valid
     */

    async function testCase({
      required,
      flagged,
      draft,
      value,
      expected,
    }: {
      required: boolean;
      flagged: boolean;
      draft: boolean;
      value: null | undefined | unknown;
      expected?: ValidationError[];
      description: string;
    }) {
      let type = options.type;
      const matrix = [];

      if (required) {
        type = options.type.required();
        matrix.push("required: true");
      } else {
        matrix.push("required: false");
      }

      type = type.features(["flag"]);

      const registry = REGISTRY.clone({
        record: resolve,
      });

      const FeaturesRecordBuilder = Record("Flag", {
        fields: {
          field: type,
        },
      });

      registry.register(FeaturesRecordBuilder);

      const hydrateParams: dehydrated.HydrateParameters = { registry };

      if (draft) {
        hydrateParams.draft = true;
        matrix.push("draft: true");
      } else {
        matrix.push("draft: false");
      }

      if (flagged) {
        hydrateParams.features = ["flag"];
        matrix.push("flagged: on");
      } else {
        hydrateParams.features = [];
        matrix.push("flagged: off");
      }

      const FeaturesRecord = FeaturesRecordBuilder.with(hydrateParams);

      const testValue: { field?: unknown } = {};

      if (value === null) {
        testValue.field = null;
        matrix.push("value: null");
      } else if (value === undefined) {
        matrix.push("value: missing");
      } else {
        testValue.field = value;
        matrix.push(`value: ${JSON.stringify(value)}`);
      }

      const result = await FeaturesRecord.validate(testValue, ENV);

      expect(result).toEqual(expected);
    }

    function match(
      cases: Row | Row[],
      expected:
        | ValidationError[]
        | { draft: ValidationError[]; published: ValidationError[] },
      description: string
    ) {
      const matches = Array.isArray(cases) ? cases : [cases];

      matches.forEach((matchOptions) => {
        const required = normalize(matchOptions.required, [true, false]);
        const draft = normalize(matchOptions.draft, [true, false]);
        const flagged = normalize(matchOptions.flagged, ["on", "off"]);
        const values =
          "success" in matchOptions
            ? matchOptions.success
            : matchOptions.failures;

        normalize(required, [true, false]).forEach((r) => {
          normalize(draft, [true, false]).forEach((d) => {
            normalize(flagged, ["on", "off"]).forEach((f) => {
              values.forEach((value) => {
                let expectedErrors;

                if (Array.isArray(expected)) {
                  expectedErrors = expected;
                } else if (d === true) {
                  expectedErrors = expected.draft;
                } else {
                  expectedErrors = expected.published;
                }

                testCase({
                  required: r,
                  flagged: f === "on" ? true : false,
                  draft: d,
                  value,
                  expected: expectedErrors,
                  description,
                });
              });
            });
          });
        });
      });
    }

    class Matcher {
      matches = new RowMatches();

      match(
        cases: Row | Row[],
        expected: ValidationError[],
        description: string
      ) {
        const matches: RowMatch[] = [];

        if (Array.isArray(cases)) {
          cases.forEach((c) => matches.push(...rowMatch(c)));
        } else {
          matches.push(...rowMatch(cases));
        }

        matches.forEach((m) => {
          this.matches.add(m);
        });

        match(cases, expected, description);
      }

      exhaustiveCheck() {
        [true, false].forEach((required) => {
          [true, false].forEach((draft) => {
            [true, false].forEach((flagged) => {
              const values: MatchValue[] = [
                "null",
                "missing",
                "success",
                "failure",
              ];
              values.forEach((value) => {
                const matchValue = { required, draft, flagged, value };
                expect(this.matches.has(matchValue)).toBeTruthy();
              });
            });
          });
        });
      }
    }

    const matcher = new Matcher();

    // Combinations:
    // flagged off, *: the field doesn't exist
    // flagged on, optional:
    //   - required: false or draft: true
    // flagged on, required:
    //   - required: true, draft: false

    //// MISSING FIELD ////
    // flagged:off * //

    matcher.match(
      [{ flagged: "off", draft: "any", required: "any", success: [undefined] }],
      [],
      "flagged off fields allow missing values"
    );

    matcher.match(
      {
        flagged: "off",
        draft: "any",
        required: "any",
        success: [null, options.success],
      },
      [keysError({ extra: ["field"] })],
      "flagged off fields don't allow providing missing values"
    );

    for (const test of options.cases) {
      matcher.match(
        {
          flagged: "off",
          draft: "any",
          required: "any",
          failures: [test.value],
        },
        [keysError({ extra: ["field"] })],
        "flagged off fields don't allow providing missing values"
      );
    }

    matcher.match(
      [
        {
          flagged: "on",
          required: "any",
          draft: "any",
          failures: [undefined],
        },
      ],
      [keysError({ missing: ["field"] })],
      "missing value when flagged on"
    );

    //// OPTIONAL ////
    // flagged:on required:false draft:any or flagged:on draft:true required:any //

    matcher.match(
      [
        {
          flagged: "on",
          required: false,
          draft: "any",
          success: [null, options.success],
        },
        {
          flagged: "on",
          required: true,
          draft: true,
          success: [null, options.success],
        },
      ],
      [],
      "optional allows null or success values"
    );

    matcher.match(
      [
        { flagged: "on", required: false, draft: "any", success: [undefined] },
        {
          flagged: "on",
          required: true,
          draft: true,
          success: [undefined],
        },
      ],
      [keysError({ missing: ["field"] })],
      "optional still requires the field when flagged on"
    );

    for (const failure of options.cases) {
      matcher.match(
        [
          {
            flagged: "on",
            required: false,
            draft: true,
            failures: [failure.value],
          },
        ],
        failure.draftErrors || [],
        "failure value in draft"
      );

      matcher.match(
        [
          {
            flagged: "on",
            required: false,
            draft: false,
            failures: [failure.value],
          },
        ],
        failure.errors || [],
        "failure value in published"
      );

      matcher.match(
        [
          {
            flagged: "on",
            required: true,
            draft: true,
            failures: [failure.value],
          },
        ],
        failure.draftErrors || [],
        "failure value in published"
      );

      matcher.match(
        [
          {
            flagged: "on",
            required: false,
            draft: true,
            failures: [failure.value],
          },
        ],
        failure.draftErrors || [],
        "failure value in draft"
      );
    }

    //// REQUIRED ////
    // flagged:on required:true draft:false //

    matcher.match(
      {
        flagged: "on",
        required: true,
        draft: false,
        success: [options.success],
      },
      [],
      "published/required"
    );

    matcher.match(
      {
        flagged: "on",
        required: true,
        draft: false,
        failures: [null],
      },
      [missingError("field")],
      "published/required disallows null"
    );

    for (const failure of options.cases) {
      matcher.match(
        [
          {
            flagged: "on",
            required: true,
            draft: false,
            failures: [failure.value],
          },
        ],
        failure.errors || [],
        "failure value"
      );

      matcher.match(
        [
          {
            flagged: "on",
            required: true,
            draft: true,
            failures: [failure.value],
          },
        ],
        failure.draftErrors || [],
        "failure value"
      );
    }

    matcher.exhaustiveCheck();
  }

  test("feature flag matrix", async () => {
    await testType({
      type: types.SingleLine(),
      success: "hello world",
      cases: [
        {
          value: 1,
          errors: [typeError("string", "field")],
          draftErrors: [typeError("string", "field")],
        },
        {
          value: "hello\nworld",
          errors: [typeError("string:single-line", "field")],
          draftErrors: [],
        },
      ],
    });

    await testType({
      type: types.Integer(),
      success: 5,
      cases: [
        {
          value: 5.5,
          errors: [typeError("number:integer", "field")],
          draftErrors: [typeError("number:integer", "field")],
        },
        {
          value: "5",
          errors: [typeError("number", "field")],
          draftErrors: [typeError("number", "field")],
        },
      ],
    });
  });

  test("when features flags are disabled, the fields aren't present in publish mode", async () => {
    const { registry } = subject();
    expect(
      await validate(Features.with({ registry, features: [] }), {
        hed: "Hello world",
        dek: "Hello, the cool world!",
      })
    ).toEqual([]);
  });

  test("when features flags are disabled, the fields aren't present in draft mode", async () => {
    const { registry } = subject();
    expect(
      await validate(Features.with({ registry, features: [], draft: true }), {
        hed: null,
        dek: null,
      })
    ).toEqual([]);
  });
});
