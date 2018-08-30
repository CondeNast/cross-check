import {
  ErrorPath,
  ValidationDescriptor,
  ValidationError,
  Validator,
  ValidatorFactory,
  invalid,
  toErrors,
  valid
} from "@cross-check/core";
import {
  MapErrorTransform,
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
import { run as validate } from "./support";

QUnit.module("Combinators");

const Success: ValidatorFactory<unknown> = (): Validator<unknown> => {
  return () => new Task(async () => valid(undefined));
};

interface FailOptions {
  reason: string;
  path: ErrorPath;
}

const Fail: ValidatorFactory<unknown, unknown> = ({
  reason,
  path
}: FailOptions) => {
  return () =>
    new Task(async () => invalid(undefined, [error(reason, null, path)]));
};

function descriptorFor<T, U extends T>(
  name: string,
  factory: ValidatorFactory<T, U>
): ValidationDescriptor<T, U>;
function descriptorFor<T, U extends T, Options>(
  name: string,
  factory: ValidatorFactory<T, U>,
  options: Options
): ValidationDescriptor<T, U>;
function descriptorFor<T, U extends T>(
  name: string,
  validator: ValidatorFactory<T, U>,
  options?: any
): ValidationDescriptor<T, U> {
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

const success = () => descriptorFor("Success", Success);
const fail = (reason: string, path: ErrorPath = []) =>
  descriptorFor("Fail", Fail, { reason, path });

function runMulti(
  factory: ValidatorFactory<unknown, ValidationDescriptor[]>,
  descriptors: ValidationDescriptor[]
): Task<ValidationError[]> {
  return new Task(async run => {
    let result = await run(
      validate(descriptorFor("multi", factory, descriptors), null)
    );
    return toErrors(result);
  });
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

export type FIXME<T> = T;

QUnit.test("mapError", async assert => {
  function map(
    descriptor: ValidationDescriptor,
    transform: MapErrorTransform
  ): Task<ValidationError[]> {
    return new Task(async run => {
      let result = await run(
        validate(
          descriptorFor("mapError", mapError as FIXME<any>, {
            do: descriptor,
            catch: transform
          }) as FIXME<any>,
          null
        )
      );

      return toErrors(result);
    });
  }

  function cast(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, () => [error("casted")]);
  }

  function append(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, errors => [...errors, error("appended")]);
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
