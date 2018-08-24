import {
  ErrorPath,
  ValidationDescriptor,
  ValidationError,
  Validator,
  ValidatorFactory,
  Validity,
  descriptor,
  invalid,
  valid
} from "@cross-check/core";
import {
  MapError,
  MapErrorOptions,
  MapErrorTransform,
  ValidationDescriptors,
  and,
  chain,
  ifValid,
  mapError,
  muteAll,
  mutePath,
  muteType,
  or
} from "@cross-check/dsl";
import Task from "no-show";
import { run } from "./support";

QUnit.module("Combinators");

const Success: ValidatorFactory<undefined, undefined, void> = (): Validator<
  undefined
> => {
  return () => new Task(async () => valid(undefined));
};

interface FailOptions {
  reason: string;
  path: ErrorPath;
}

const Fail: ValidatorFactory<undefined, undefined, FailOptions> = ({
  reason,
  path
}: FailOptions) => {
  return (v: undefined) =>
    new Task<Validity<undefined, undefined>>(async () =>
      invalid(v, [error(reason, null, path)])
    );
};

function descriptorFor<T, U extends T>(
  name: string,
  factory: ValidatorFactory<T, U, void>
): ValidationDescriptor<T, U>;
function descriptorFor<T, U extends T, Options>(
  name: string,
  factory: ValidatorFactory<T, U, Options>,
  options: Options
): ValidationDescriptor<T, U>;
function descriptorFor<T, U extends T>(
  name: string,
  validator: ValidatorFactory<T, U, any>,
  options?: any
): ValidationDescriptor<T> {
  return {
    name,
    validator,
    options,
    contexts: []
  };
}

function error(
  reason: string,
  details: unknown = null,
  path: ErrorPath = []
): ValidationError {
  return {
    path,
    message: {
      name: reason,
      details
    }
  };
}

const success = () => descriptorFor<undefined, undefined>("Success", Success);
const fail = (reason: string, path: ErrorPath = []) =>
  descriptorFor("Fail", Fail, { reason, path });

async function runMulti(
  factory: ValidatorFactory<
    undefined,
    undefined,
    ValidationDescriptors<undefined, undefined>
  >,
  descriptors: Array<ValidationDescriptor<undefined, undefined>>
): Promise<ValidationError[]> {
  let results = await run(
    descriptor("multi", factory, new ValidationDescriptors(descriptors)),
    undefined
  );

  return results.valid ? [] : results.errors;
}

QUnit.test("and", async assert => {
  assert.deepEqual(await runMulti(and, [success()]), []);
  assert.deepEqual(await runMulti(and, [fail("reason")]), [error("reason")]);
  assert.deepEqual(
    await runMulti(and, [
      success(),
      fail("reason 1"),
      success(),
      fail("reason 2"),
      success()
    ]),
    [error("reason 1"), error("reason 2")]
  );
  assert.deepEqual(
    await runMulti(and, [fail("reason"), fail("reason"), fail("reason")]),
    [error("reason")]
  );
  assert.deepEqual(
    await runMulti(and, [fail("reason", ["foo"]), fail("reason", ["bar"])]),
    [error("reason", null, ["foo"]), error("reason", null, ["bar"])]
  );
});

QUnit.test("or", async assert => {
  assert.deepEqual(await runMulti(or, [success()]), []);
  assert.deepEqual(await runMulti(or, [fail("reason")]), [
    error("multiple", [[error("reason")]])
  ]);
  assert.deepEqual(
    await runMulti(or, [
      success(),
      fail("reason 1"),
      success(),
      fail("reason 2"),
      success()
    ]),
    []
  );
  assert.deepEqual(
    await runMulti(or, [fail("reason 1"), fail("reason 2"), fail("reason 3")]),
    [
      error("multiple", [
        [error("reason 1")],
        [error("reason 2")],
        [error("reason 3")]
      ])
    ]
  );
  assert.deepEqual(
    await runMulti(or, [fail("reason"), fail("reason"), fail("reason")]),
    [
      error("multiple", [
        [error("reason")],
        [error("reason")],
        [error("reason")]
      ])
    ]
  );
});

QUnit.test("if", async assert => {
  assert.deepEqual(await runMulti(ifValid, [success(), success()]), []);
  assert.deepEqual(await runMulti(ifValid, [fail("reason"), success()]), []);
  assert.deepEqual(await runMulti(ifValid, [success(), fail("reason")]), [
    error("reason")
  ]);

  assert.deepEqual(
    await runMulti(ifValid, [
      success(),
      fail("reason 1"),
      success(),
      fail("reason 2"),
      success()
    ]),
    []
  );

  assert.deepEqual(
    await runMulti(ifValid, [fail("reason"), fail("reason"), fail("reason")]),
    []
  );
});

QUnit.test("chain", async assert => {
  assert.deepEqual(await runMulti(chain, [success()]), []);
  assert.deepEqual(await runMulti(chain, [fail("reason")]), [error("reason")]);
  assert.deepEqual(
    await runMulti(chain, [
      success(),
      fail("reason 1"),
      success(),
      fail("reason 2"),
      success()
    ]),
    [error("reason 1")]
  );
  assert.deepEqual(
    await runMulti(chain, [fail("reason"), fail("reason"), fail("reason")]),
    [error("reason")]
  );
});

QUnit.test("mapError", async assert => {
  function map<U extends undefined>(
    desc: ValidationDescriptor<undefined, U>,
    transform: MapErrorTransform
  ): Task<Validity<undefined, U>> {
    let options: MapErrorOptions<undefined, U> = {
      do: desc,
      catch: transform
    } as MapErrorOptions<undefined, U>;

    return run(
      descriptorFor("mapError", mapError as MapError<undefined, U>, options),
      undefined
    );
  }

  function cast<U extends undefined>(
    desc: ValidationDescriptor<undefined, U>
  ): Task<Validity<undefined, U>> {
    return map(desc, () => [error("casted")]);
  }

  function append<U extends undefined>(
    desc: ValidationDescriptor<undefined, U>
  ): Task<Validity<undefined, U>> {
    return map(desc, errors => [...errors, error("appended")]);
  }

  assert.deepEqual(await cast(success()), []);
  assert.deepEqual(await cast(fail("reason")), [error("casted")]);

  assert.deepEqual(await append(success()), []);
  assert.deepEqual(await append(fail("reason")), [
    error("reason"),
    error("appended")
  ]);

  assert.deepEqual(await map(success(), muteAll()), []);
  assert.deepEqual(await map(fail("reason"), muteAll()), []);

  assert.deepEqual(await map(success(), muteType("foo")), []);
  assert.deepEqual(await map(fail("foo"), muteType("foo")), []);
  assert.deepEqual(await map(fail("bar"), muteType("foo")), [error("bar")]);

  assert.deepEqual(await map(success(), mutePath(["foo", "bar"])), []);
  assert.deepEqual(
    await map(fail("foo", ["foo", "bar"]), mutePath(["foo", "bar"])),
    []
  );
  assert.deepEqual(
    await map(fail("foo", ["foo", "bar", "baz"]), mutePath(["foo", "bar"])),
    []
  );
  assert.deepEqual(await map(fail("foo", ["foo"]), mutePath(["foo", "bar"])), [
    error("foo", null, ["foo"])
  ]);
  assert.deepEqual(
    await map(fail("foo", ["not", "it"]), mutePath(["foo", "bar"])),
    [error("foo", null, ["not", "it"])]
  );

  assert.deepEqual(await map(success(), mutePath(["foo", "bar"], true)), []);
  assert.deepEqual(
    await map(fail("foo", ["foo", "bar"]), mutePath(["foo", "bar"], true)),
    []
  );
  assert.deepEqual(
    await map(
      fail("foo", ["foo", "bar", "baz"]),
      mutePath(["foo", "bar"], true)
    ),
    [error("foo", null, ["foo", "bar", "baz"])]
  );
  assert.deepEqual(
    await map(fail("foo", ["foo"]), mutePath(["foo", "bar"], true)),
    [error("foo", null, ["foo"])]
  );
  assert.deepEqual(
    await map(fail("foo", ["not", "it"]), mutePath(["foo", "bar"], true)),
    [error("foo", null, ["not", "it"])]
  );
});
