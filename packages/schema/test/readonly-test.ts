import { REGISTRY, Record, builders } from "@cross-check/schema";
import { ENV, keysError, module } from "./support";
import { ISODate } from "./support/date";
import { resolve } from "./support/records";

const mod = module("[schema] readonly");

mod.test(
  "readonly() means read: true, create: false, update: false",
  async (assert) => {
    await testMode(assert, ISODate().readonly(), { read: true });
  }
);

mod.test(
  `writable({ on: "create" }) means read: true, create: true, update: false`,
  async (assert) => {
    await testMode(assert, ISODate().writable({ on: "create" }), {
      create: true,
      read: true,
    });
  }
);

mod.test(
  `writable({ on: "update" }) means read: true, create: false, update: true`,
  async (assert) => {
    await testMode(assert, ISODate().writable({ on: "update" }), {
      read: true,
      update: true,
    });
  }
);

mod.test("no readonly() means always required", async (assert) => {
  await testMode(assert, ISODate(), { create: true, read: true, update: true });
});

async function testMode(
  assert: typeof QUnit.assert,
  type: builders.TypeBuilder,
  options: { read?: true; create?: true; update?: true }
) {
  const modes: Array<"create" | "read" | "update"> = [
    "create",
    "read",
    "update",
  ];

  const Article = Record("Article", {
    fields: {
      createdAt: type,
    },
  });

  for (const mode of modes) {
    const registry = REGISTRY.clone({
      record: resolve,
    });
    const recordWithMode = Article.with({ mode, registry });
    const result = await recordWithMode.validate({}, ENV);

    if (options[mode]) {
      assert.deepEqual(result, [keysError({ missing: ["createdAt"] })]);
    } else {
      assert.deepEqual(result, []);
    }
  }
}
