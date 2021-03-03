import {
  ErrorPath,
  Task,
  ValidationDescriptor,
  ValidationError,
  Validator,
  ValidatorFactory,
} from "@cross-check/core";
import {
  MapErrorOptions,
  MapErrorTransform,
  and,
  chain,
  ifValid,
  mapError,
  muteAll,
  mutePath,
  muteType,
  or,
} from "@cross-check/dsl";
import { run } from "./support";

describe("Combinators", () => {
  const Success: ValidatorFactory<unknown, void> = (): Validator<unknown> => {
    return () => new Task(async () => []);
  };

  interface FailOptions {
    reason: string;
    path: ErrorPath;
  }

  const Fail: ValidatorFactory<unknown, FailOptions> = ({
    reason,
    path,
  }: FailOptions) => {
    return () =>
      new Task<ValidationError[]>(async () => [error(reason, null, path)]);
  };

  function descriptorFor<T>(
    name: string,
    factory: ValidatorFactory<T, void>
  ): ValidationDescriptor<T>;
  function descriptorFor<T, Options>(
    name: string,
    factory: ValidatorFactory<T, Options>,
    options: Options
  ): ValidationDescriptor<T>;
  function descriptorFor<T>(
    name: string,
    validator: ValidatorFactory<T, any>,
    options?: any
  ): ValidationDescriptor<T> {
    return {
      name,
      validator,
      options,
      contexts: [],
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
        details,
      },
    };
  }

  const success = () => descriptorFor("Success", Success);
  const fail = (reason: string, path: ErrorPath = []) =>
    descriptorFor("Fail", Fail, { reason, path });

  function runMulti(
    factory: ValidatorFactory<unknown, ValidationDescriptor[]>,
    descriptors: ValidationDescriptor[]
  ): Task<ValidationError[]> {
    return run(descriptorFor("multi", factory, descriptors), null);
  }

  test("and", async () => {
    expect(await runMulti(and, [success()])).toEqual([]);
    expect(await runMulti(and, [fail("reason")])).toEqual([error("reason")]);
    expect(
      await runMulti(and, [
        success(),
        fail("reason 1"),
        success(),
        fail("reason 2"),
        success(),
      ])
    ).toEqual([error("reason 1"), error("reason 2")]);
    expect(
      await runMulti(and, [fail("reason"), fail("reason"), fail("reason")])
    ).toEqual([error("reason")]);
    expect(
      await runMulti(and, [fail("reason", ["foo"]), fail("reason", ["bar"])])
    ).toEqual([error("reason", null, ["foo"]), error("reason", null, ["bar"])]);
  });

  test("or", async () => {
    expect(await runMulti(or, [success()])).toEqual([]);
    expect(await runMulti(or, [fail("reason")])).toEqual([
      error("multiple", [[error("reason")]]),
    ]);
    expect(
      await runMulti(or, [
        success(),
        fail("reason 1"),
        success(),
        fail("reason 2"),
        success(),
      ])
    ).toEqual([]);
    expect(
      await runMulti(or, [fail("reason 1"), fail("reason 2"), fail("reason 3")])
    ).toEqual([
      error("multiple", [
        [error("reason 1")],
        [error("reason 2")],
        [error("reason 3")],
      ]),
    ]);
    expect(
      await runMulti(or, [fail("reason"), fail("reason"), fail("reason")])
    ).toEqual([
      error("multiple", [
        [error("reason")],
        [error("reason")],
        [error("reason")],
      ]),
    ]);
  });

  test("if", async () => {
    expect(await runMulti(ifValid, [success(), success()])).toEqual([]);
    expect(await runMulti(ifValid, [fail("reason"), success()])).toEqual([]);
    expect(await runMulti(ifValid, [success(), fail("reason")])).toEqual([
      error("reason"),
    ]);

    expect(
      await runMulti(ifValid, [
        success(),
        fail("reason 1"),
        success(),
        fail("reason 2"),
        success(),
      ])
    ).toEqual([]);

    expect(
      await runMulti(ifValid, [fail("reason"), fail("reason"), fail("reason")])
    ).toEqual([]);
  });

  test("chain", async () => {
    expect(await runMulti(chain, [success()])).toEqual([]);
    expect(await runMulti(chain, [fail("reason")])).toEqual([error("reason")]);
    expect(
      await runMulti(chain, [
        success(),
        fail("reason 1"),
        success(),
        fail("reason 2"),
        success(),
      ])
    ).toEqual([error("reason 1")]);
    expect(
      await runMulti(chain, [fail("reason"), fail("reason"), fail("reason")])
    ).toEqual([error("reason")]);
  });

  test("mapError", async () => {
    function map(
      descriptor: ValidationDescriptor,
      transform: MapErrorTransform
    ): Task<ValidationError[]> {
      return run(
        descriptorFor<unknown, MapErrorOptions<unknown>>("mapError", mapError, {
          do: descriptor,
          catch: transform,
        }),
        null
      );
    }

    function cast(descriptor: ValidationDescriptor): Task<ValidationError[]> {
      return map(descriptor, () => [error("casted")]);
    }

    function append(descriptor: ValidationDescriptor): Task<ValidationError[]> {
      return map(descriptor, (errors) => [...errors, error("appended")]);
    }

    expect(await cast(success())).toEqual([]);
    expect(await cast(fail("reason"))).toEqual([error("casted")]);

    expect(await append(success())).toEqual([]);
    expect(await append(fail("reason"))).toEqual([
      error("reason"),
      error("appended"),
    ]);

    expect(await map(success(), muteAll())).toEqual([]);
    expect(await map(fail("reason"), muteAll())).toEqual([]);

    expect(await map(success(), muteType("foo"))).toEqual([]);
    expect(await map(fail("foo"), muteType("foo"))).toEqual([]);
    expect(await map(fail("bar"), muteType("foo"))).toEqual([error("bar")]);

    expect(await map(success(), mutePath(["foo", "bar"]))).toEqual([]);
    expect(
      await map(fail("foo", ["foo", "bar"]), mutePath(["foo", "bar"]))
    ).toEqual([]);
    expect(
      await map(fail("foo", ["foo", "bar", "baz"]), mutePath(["foo", "bar"]))
    ).toEqual([]);
    expect(await map(fail("foo", ["foo"]), mutePath(["foo", "bar"]))).toEqual([
      error("foo", null, ["foo"]),
    ]);
    expect(
      await map(fail("foo", ["not", "it"]), mutePath(["foo", "bar"]))
    ).toEqual([error("foo", null, ["not", "it"])]);

    expect(await map(success(), mutePath(["foo", "bar"], true))).toEqual([]);
    expect(
      await map(fail("foo", ["foo", "bar"]), mutePath(["foo", "bar"], true))
    ).toEqual([]);
    expect(
      await map(
        fail("foo", ["foo", "bar", "baz"]),
        mutePath(["foo", "bar"], true)
      )
    ).toEqual([error("foo", null, ["foo", "bar", "baz"])]);
    expect(
      await map(fail("foo", ["foo"]), mutePath(["foo", "bar"], true))
    ).toEqual([error("foo", null, ["foo"])]);
    expect(
      await map(fail("foo", ["not", "it"]), mutePath(["foo", "bar"], true))
    ).toEqual([error("foo", null, ["not", "it"])]);
  });
});
