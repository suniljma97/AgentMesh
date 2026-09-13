import { describe, expect, test } from "bun:test";
import { sep } from "node:path";
import { resolveWithinRoot } from "./sandbox.js";

const root = process.platform === "win32" ? "C:\\project" : "/project";

describe("resolveWithinRoot", () => {
  test("resolves a plain relative path under the root", () => {
    const result = resolveWithinRoot(root, "src/index.ts");
    expect(result.endsWith(`src${sep}index.ts`)).toBe(true);
  });

  test("defaults to the root itself when no target is given", () => {
    expect(resolveWithinRoot(root)).toBe(root);
  });

  test("rejects a '..' escape", () => {
    expect(() => resolveWithinRoot(root, "../outside.txt")).toThrow(
      /escapes the sandboxed root/,
    );
  });

  test("rejects a deeper '..' escape", () => {
    expect(() => resolveWithinRoot(root, "../../../etc/passwd")).toThrow(
      /escapes the sandboxed root/,
    );
  });

  test("rejects an absolute path outside the root", () => {
    const outside =
      process.platform === "win32" ? "D:\\secrets" : "/etc/passwd";
    expect(() => resolveWithinRoot(root, outside)).toThrow(
      /escapes the sandboxed root/,
    );
  });

  test("allows an absolute path that is inside the root", () => {
    const inside =
      process.platform === "win32"
        ? "C:\\project\\src\\index.ts"
        : "/project/src/index.ts";
    expect(() => resolveWithinRoot(root, inside)).not.toThrow();
  });
});
