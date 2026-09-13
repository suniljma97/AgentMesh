import { describe, expect, test } from "bun:test";
import { checkExpectation } from "./check.js";

describe("checkExpectation", () => {
  test("passes when the output mentions the expected file", () => {
    const result = checkExpectation(
      "The interface is defined in packages/shared/src/index.ts.",
      { mustMentionFile: "packages/shared/src/index.ts" },
    );
    expect(result).toEqual({ passed: true, reasons: [] });
  });

  test("fails with a clear reason when the expected file is missing", () => {
    const result = checkExpectation("I could not find it.", {
      mustMentionFile: "packages/shared/src/index.ts",
    });
    expect(result.passed).toBe(false);
    expect(result.reasons).toEqual([
      'Expected output to mention file "packages/shared/src/index.ts"',
    ]);
  });

  test("passes when the output contains the expected text", () => {
    const result = checkExpectation(
      "Skills: code-analysis, documentation-search",
      {
        mustContainText: "documentation-search",
      },
    );
    expect(result.passed).toBe(true);
  });

  test("requires all given checks to pass (AND, not OR)", () => {
    const result = checkExpectation(
      "Defined in packages/shared/src/index.ts, but nothing else notable.",
      {
        mustMentionFile: "packages/shared/src/index.ts",
        mustContainText: "does-not-appear",
      },
    );
    expect(result.passed).toBe(false);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toContain("does-not-appear");
  });

  test("passes trivially when no checks are given", () => {
    const result = checkExpectation("anything", {});
    expect(result).toEqual({ passed: true, reasons: [] });
  });
});
