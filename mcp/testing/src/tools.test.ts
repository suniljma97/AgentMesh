import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTests } from "./tools.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "agentmesh-runtests-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("runTests", () => {
  test("reports passed: true for a passing suite", async () => {
    await writeFile(
      join(dir, "passing.test.ts"),
      `import { test, expect } from "bun:test";\ntest("ok", () => expect(1 + 1).toBe(2));\n`,
    );

    const result = await runTests({}, { root: dir });

    expect(result.passed).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("1 pass");
  });

  test("reports passed: false with output for a failing suite, without throwing", async () => {
    await writeFile(
      join(dir, "failing.test.ts"),
      `import { test, expect } from "bun:test";\ntest("bad", () => expect(1 + 1).toBe(3));\n`,
    );

    const result = await runTests({}, { root: dir });

    expect(result.passed).toBe(false);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain("fail");
  });

  test("rejects a cwd that escapes the sandboxed root", async () => {
    await expect(runTests({ cwd: "../../etc" }, { root: dir })).rejects.toThrow(
      /escapes the sandboxed root/,
    );
  });
});
