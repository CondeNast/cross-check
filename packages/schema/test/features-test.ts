import { ValidationError } from "@cross-check/core";
import { Record, builders, dehydrated, types } from "@cross-check/schema";
import { unknown } from "ts-std";
import { ENV, keysError, missingError, typeError, validate } from "./support";
import { Features } from "./support/records";

QUnit.dump.maxDepth = 100;

QUnit.module("[schema] - record with feature flags");

QUnit.test(
  "all feature-flagged fields are optional in draft mode",
  async assert => {
    assert.deepEqual(
      await validate(
        Features.with({
          features: ["category-picker", "description", "map"],
          draft: true
        }),
        {
          hed: null,
          dek: null,
          categories: null,
          description: null,
          location: null
        }
      ),
      [],
      "all fields can be null in drafts"
    );
  }
);

QUnit.test(
  "all feature-flagged fields are present in published mode if present",
  async assert => {
    assert.deepEqual(
      await validate(
        Features.with({
          features: ["category-picker", "description", "map"],
          draft: true
        }),
        {
          hed: "Hello world",
          dek: "Hello, the cool world!",
          categories: null,
          description: null,
          location: null
        }
      ),
      [],
      "all fields can be null in drafts"
    );
  }
);

export interface TestCase {
  type: builders.TypeBuilder;
  success: {};
  cases: Array<{
    value: {} | null | undefined;
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
  failures: Array<{} | null | undefined>;
}

interface ValueRow extends RowOptions {
  success: Array<{} | null | undefined>;
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
    let required = this.matches.get(match.required);

    if (!required) {
      return false;
    }

    let draft = required.get(match.draft);

    if (!draft) {
      return false;
    }

    let flagged = draft.get(match.flagged);

    if (!flagged) {
      return false;
    }

    return flagged.has(match.value);
  }
}

type MatchValue = "null" | "missing" | "success" | "failure";

function rowMatch(row: Row): RowMatch[] {
  let requiredValues = normalize(row.required, [true, false]);
  let draftValues = normalize(row.draft, [true, false]);
  let flaggedValues = normalize(row.flagged, ["on", "off"]).map(
    v => v === "on"
  );

  let values: MatchValue[] = [];

  if ("success" in row) {
    values.push(
      ...row.success.map(r => {
        if (r === null) return "null";
        else if (r === undefined) return "missing";
        else return "success";
      })
    );
  } else {
    values.push(
      ...row.failures.map(r => {
        if (r === null) return "null";
        else if (r === undefined) return "missing";
        else return "failure";
      })
    );
  }

  let matches: RowMatch[] = [];

  requiredValues.forEach(required =>
    draftValues.forEach(draft =>
      flaggedValues.forEach(flagged =>
        values.forEach(value =>
          matches.push({
            required,
            draft,
            flagged,
            value
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

async function testType(assert: typeof QUnit.assert, options: TestCase) {
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
    description
  }: {
    required: boolean;
    flagged: boolean;
    draft: boolean;
    value: null | undefined | {};
    expected?: ValidationError[];
    description: string;
  }) {
    let type = options.type;
    let matrix = [];

    if (required) {
      type = options.type.required();
      matrix.push("required: true");
    } else {
      matrix.push("required: false");
    }

    type = type.features(["flag"]);

    const FeaturesRecordBuilder = Record("Flag", {
      fields: {
        field: type
      }
    });

    let hydrateParams: dehydrated.HydrateParameters = {};

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

    let FeaturesRecord = FeaturesRecordBuilder.with(hydrateParams);

    let testValue: { field?: unknown } = {};

    if (value === null) {
      testValue.field = null;
      matrix.push("value: null");
    } else if (value === undefined) {
      matrix.push("value: missing");
    } else {
      testValue.field = value;
      matrix.push(`value: ${JSON.stringify(value)}`);
    }

    let result = await FeaturesRecord.validate(testValue, ENV);

    assert.deepEqual(
      result,
      expected,
      `${description} -- matrix=[[ ${matrix.join(
        ", "
      )} ]] :: value=${JSON.stringify(value)}`
    );
  }

  function match(
    cases: Row | Row[],
    expected:
      | ValidationError[]
      | { draft: ValidationError[]; published: ValidationError[] },
    description: string
  ) {
    let matches = Array.isArray(cases) ? cases : [cases];

    matches.forEach(matchOptions => {
      let required = normalize(matchOptions.required, [true, false]);
      let draft = normalize(matchOptions.draft, [true, false]);
      let flagged = normalize(matchOptions.flagged, ["on", "off"]);
      let values =
        "success" in matchOptions
          ? matchOptions.success
          : matchOptions.failures;

      normalize(required, [true, false]).forEach(r => {
        normalize(draft, [true, false]).forEach(d => {
          normalize(flagged, ["on", "off"]).forEach(f => {
            values.forEach(value => {
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
                description
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
      let matches: RowMatch[] = [];

      if (Array.isArray(cases)) {
        cases.forEach(c => matches.push(...rowMatch(c)));
      } else {
        matches.push(...rowMatch(cases));
      }

      matches.forEach(m => {
        this.matches.add(m);
      });

      match(cases, expected, description);
    }

    exhaustiveCheck() {
      [true, false].forEach(required => {
        [true, false].forEach(draft => {
          [true, false].forEach(flagged => {
            let values: MatchValue[] = [
              "null",
              "missing",
              "success",
              "failure"
            ];
            values.forEach(value => {
              let matchValue = { required, draft, flagged, value };
              assert.ok(
                this.matches.has(matchValue),
                `Exhaustiveness check: ${JSON.stringify(matchValue)}`
              );
            });
          });
        });
      });
    }
  }

  let matcher = new Matcher();

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
      success: [null, options.success]
    },
    [keysError({ extra: ["field"] })],
    "flagged off fields don't allow providing missing values"
  );

  for (let test of options.cases) {
    matcher.match(
      { flagged: "off", draft: "any", required: "any", failures: [test.value] },
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
        failures: [undefined]
      }
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
        success: [null, options.success]
      },
      {
        flagged: "on",
        required: true,
        draft: true,
        success: [null, options.success]
      }
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
        success: [undefined]
      }
    ],
    [keysError({ missing: ["field"] })],
    "optional still requires the field when flagged on"
  );

  for (let failure of options.cases) {
    matcher.match(
      [
        {
          flagged: "on",
          required: false,
          draft: true,
          failures: [failure.value]
        }
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
          failures: [failure.value]
        }
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
          failures: [failure.value]
        }
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
          failures: [failure.value]
        }
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
      success: [options.success]
    },
    [],
    "published/required"
  );

  matcher.match(
    {
      flagged: "on",
      required: true,
      draft: false,
      failures: [null]
    },
    [missingError("field")],
    "published/required disallows null"
  );

  for (let failure of options.cases) {
    matcher.match(
      [
        {
          flagged: "on",
          required: true,
          draft: false,
          failures: [failure.value]
        }
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
          failures: [failure.value]
        }
      ],
      failure.draftErrors || [],
      "failure value"
    );
  }

  matcher.exhaustiveCheck();
}

QUnit.test("feature flag matrix", async assert => {
  await testType(assert, {
    type: types.SingleLine(),
    success: "hello world",
    cases: [
      {
        value: 1,
        errors: [typeError("string", "field")],
        draftErrors: [typeError("string", "field")]
      },
      {
        value: "hello\nworld",
        errors: [typeError("string:single-line", "field")],
        draftErrors: []
      }
    ]
  });

  await testType(assert, {
    type: types.Integer(),
    success: 5,
    cases: [
      {
        value: 5.5,
        errors: [typeError("number:integer", "field")],
        draftErrors: [typeError("number:integer", "field")]
      },
      {
        value: "5",
        errors: [typeError("number", "field")],
        draftErrors: [typeError("number", "field")]
      }
    ]
  });
});

QUnit.test(
  "when features flags are disabled, the fields aren't present in publish mode",
  async assert => {
    assert.deepEqual(
      await validate(Features.with({ features: [] }), {
        hed: "Hello world",
        dek: "Hello, the cool world!"
      }),
      [],
      "flagged out fields are missing"
    );
  }
);

QUnit.test(
  "when features flags are disabled, the fields aren't present in draft mode",
  async assert => {
    assert.deepEqual(
      await validate(Features.with({ features: [], draft: true }), {
        hed: null,
        dek: null
      }),
      [],
      "flagged out fields fields are missing in drafts"
    );
  }
);

// QUnit.test("parsing", assert => {
//   assert.deepEqual(
//     Features.parse({
//       hed: "Hello world",
//       body: "The body"
//     }),
//     {
//       hed: "Hello world",
//       dek: null,
//       body: "The body"
//     }
//   );

//   assert.deepEqual(
//     Features.parse({
//       hed: "Hello world",
//       dek: "Hello. Hello world.",
//       body: "The body"
//     }),
//     {
//       hed: "Hello world",
//       dek: "Hello. Hello world.",
//       body: "The body"
//     }
//   );
// });

// QUnit.test("serialize", assert => {
//   assert.deepEqual(
//     Features.serialize({
//       hed: "Hello world",
//       dek: null,
//       body: "The body"
//     }),
//     {
//       hed: "Hello world",
//       body: "The body"
//     }
//   );

//   assert.deepEqual(
//     Features.serialize({
//       hed: "Hello world",
//       dek: "Hello. Hello world.",
//       body: "The body"
//     }),
//     {
//       hed: "Hello world",
//       dek: "Hello. Hello world.",
//       body: "The body"
//     }
//   );
// });

// QUnit.test("a valid published draft", async assert => {
//   assert.deepEqual(
//     await validatePublished(Features, {
//       hed: "Hello world",
//       dek: "Hello, the cool world!\nMultiline allowed here",
//       body: "Hello world.\nThis text is permitted.\nTotally fine."
//     }),
//     [],
//     "a valid draft"
//   );
// });

// QUnit.test("Invalid shape", async assert => {
//   assert.deepEqual(
//     await validatePublished(Features, false as any),
//     [typeError("object", null)],
//     "false is not an object"
//   );

//   assert.deepEqual(
//     await validatePublished(Features, [] as any),
//     [typeError("object", null)],
//     "[] is not an object"
//   );

//   assert.deepEqual(
//     await validatePublished(Features, (() => null) as any),
//     [typeError("object", null)],
//     "function is not an object"
//   );

//   QUnit.dump.maxDepth = 10;

//   assert.deepEqual(
//     await validatePublished(Features, {}),
//     [
//       keysError({
//         missing: ["hed", "dek", "body"]
//       })
//     ],
//     "missing all fields"
//   );

//   assert.deepEqual(
//     await validatePublished(Features, {
//       hed: "Hello world",
//       dek: "Hello, the cool world!"
//     }),
//     [
//       keysError({
//         missing: ["body"]
//       })
//     ],
//     "missing one field"
//   );

//   assert.deepEqual(
//     await validatePublished(Features, {
//       hed: "Hello world",
//       dek: "Hello, the cool world!",
//       body: "Hello!!!",
//       wat: "dis"
//     }),
//     [
//       keysError({
//         extra: ["wat"]
//       })
//     ],
//     "extra fields"
//   );

//   assert.deepEqual(
//     await validatePublished(Features, {
//       hed: "Hello world",
//       dek: "Hello, the cool world!",
//       wat: "dis"
//     }),
//     [
//       keysError({
//         missing: ["body"],
//         extra: ["wat"]
//       })
//     ],
//     "extra and missing fields"
//   );
// });
