import { afterEach, describe, expect, test } from "bun:test";
import { getDb } from "./client.js";

const ORIGINAL_URL = process.env.AGENTMESH_DB_URL;

afterEach(() => {
  if (ORIGINAL_URL === undefined) {
    delete process.env.AGENTMESH_DB_URL;
  } else {
    process.env.AGENTMESH_DB_URL = ORIGINAL_URL;
  }
});

describe("getDb", () => {
  test("is not a silently-stale singleton: each call honors its own defaultUrl", async () => {
    delete process.env.AGENTMESH_DB_URL;

    const first = getDb(":memory:");
    const second = getDb(":memory:");

    // Each is a fresh in-memory database — writing to one must not appear in
    // the other. (A cached singleton that ignored the second call's URL
    // would make this fail by sharing the first connection.)
    await first.execute("CREATE TABLE t (v TEXT)");
    await first.execute("INSERT INTO t VALUES ('only-in-first')");

    await expect(second.execute("SELECT * FROM t")).rejects.toThrow();
  });

  test("AGENTMESH_DB_URL overrides the given defaultUrl", async () => {
    process.env.AGENTMESH_DB_URL = ":memory:";

    // A path under a directory that doesn't exist: if the override didn't
    // win and this URL were actually used, opening/querying it would fail.
    const db = getDb("file:./this/directory/does/not/exist/db.sqlite");

    await expect(
      db.execute("SELECT name FROM sqlite_master WHERE type='table'"),
    ).resolves.toBeTruthy();
  });
});
