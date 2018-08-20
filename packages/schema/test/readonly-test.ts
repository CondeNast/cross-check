import { REGISTRY, Record } from "@cross-check/schema";
import { TypeBuilder } from "@cross-check/schema/src/descriptors/builders";
import { ENV, keysError } from "./support";
import { ISODate } from "./support/date";

QUnit.module("[schema] readonly");

QUnit.test(
  "readonly() means read: true, create: false, update: false",
  async assert => {
    await testMode(assert, ISODate().readonly(), { read: true });
  }
);

QUnit.test(
  `writable({ on: "create" }) means read: true, create: true, update: false`,
  async assert => {
    await testMode(assert, ISODate().writable({ on: "create" }), {
      create: true,
      read: true
    });
  }
);

QUnit.test(
  `writable({ on: "update" }) means read: true, create: false, update: true`,
  async assert => {
    await testMode(assert, ISODate().writable({ on: "update" }), {
      read: true,
      update: true
    });
  }
);

QUnit.test("no readonly() means always required", async assert => {
  await testMode(assert, ISODate(), { create: true, read: true, update: true });
});

async function testMode(
  assert: typeof QUnit.assert,
  type: TypeBuilder,
  options: { read?: true; create?: true; update?: true }
) {
  let modes: Array<"create" | "read" | "update"> = ["create", "read", "update"];

  const Article = Record("Article", {
    fields: {
      createdAt: type
    },
    registry: REGISTRY.clone()
  });

  for (let mode of modes) {
    let recordWithMode = Article.with({ mode });
    let result = await recordWithMode.validate({}, ENV);

    if (options[mode]) {
      assert.deepEqual(result, [keysError({ missing: ["createdAt"] })]);
    } else {
      assert.deepEqual(result, []);
    }
  }
}
