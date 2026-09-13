import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listFiles, readFile, searchCode } from "./tools.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "agentmesh-fs-test-"));
  await writeFile(join(root, "a.ts"), "export const hello = 'world';\n");
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "b.ts"), "export function foo() {}\n");
  await mkdir(join(root, "node_modules", "pkg"), { recursive: true });
  await writeFile(join(root, "node_modules", "pkg", "index.js"), "ignored");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("listFiles", () => {
  test("lists files recursively, ignoring node_modules", async () => {
    const files = await listFiles({}, { root });
    expect(files).toEqual(["a.ts", "src/b.ts"]);
  });

  test("lists a single sub-directory when path is given", async () => {
    const files = await listFiles({ path: "src" }, { root });
    expect(files).toEqual(["src/b.ts"]);
  });

  test("rejects a path that escapes the sandboxed root", async () => {
    await expect(listFiles({ path: "../../etc" }, { root })).rejects.toThrow(
      /escapes the sandboxed root/,
    );
  });
});

describe("readFile", () => {
  test("reads a file's contents", async () => {
    const content = await readFile({ path: "a.ts" }, { root });
    expect(content).toBe("export const hello = 'world';\n");
  });

  test("rejects a path that escapes the sandboxed root", async () => {
    await expect(
      readFile({ path: "../outside.txt" }, { root }),
    ).rejects.toThrow(/escapes the sandboxed root/);
  });
});

describe("searchCode", () => {
  test("finds matching lines across files, skipping node_modules", async () => {
    const matches = await searchCode({ query: "export" }, { root });
    expect(matches).toEqual([
      { file: "a.ts", line: 1, text: "export const hello = 'world';" },
      { file: "src/b.ts", line: 1, text: "export function foo() {}" },
    ]);
  });

  test("respects maxResults", async () => {
    const matches = await searchCode(
      { query: "export", maxResults: 1 },
      { root },
    );
    expect(matches).toHaveLength(1);
  });

  test("returns no matches for a query that isn't present", async () => {
    const matches = await searchCode({ query: "nope-not-here" }, { root });
    expect(matches).toEqual([]);
  });
});
