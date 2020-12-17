import { REGISTRY, Record, builders } from "@cross-check/schema";
import { ENV, keysError } from "./support";
import { ISODate } from "./support/date";
import { resolve } from "./support/records";

describe("[schema] readonly", () => {
  test("readonly() means read: true, create: false, update: false", async () => {
    await testMode(ISODate().readonly(), { read: true });
  });

  test(`writable({ on: "create" }) means read: true, create: true, update: false`, async () => {
    await testMode(ISODate().writable({ on: "create" }), {
      create: true,
      read: true,
    });
  });

  test(`writable({ on: "update" }) means read: true, create: false, update: true`, async () => {
    await testMode(ISODate().writable({ on: "update" }), {
      read: true,
      update: true,
    });
  });

  test("no readonly() means always required", async () => {
    await testMode(ISODate(), { create: true, read: true, update: true });
  });
});

async function testMode(
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
      expect(result).toEqual([keysError({ missing: ["createdAt"] })]);
    } else {
      expect(result).toEqual([]);
    }
  }
}
