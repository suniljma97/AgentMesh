import type { GoldenTaskExpectation } from "./golden-tasks/types.js";

export interface CheckResult {
  passed: boolean;
  reasons: string[];
}

/**
 * Pure expectation-checking logic, kept separate from the runner so it's
 * testable without an LLM call, a tool, or a database.
 */
export function checkExpectation(
  output: string,
  expect: GoldenTaskExpectation,
): CheckResult {
  const reasons: string[] = [];

  if (expect.mustMentionFile && !output.includes(expect.mustMentionFile)) {
    reasons.push(`Expected output to mention file "${expect.mustMentionFile}"`);
  }

  if (expect.mustContainText && !output.includes(expect.mustContainText)) {
    reasons.push(`Expected output to contain text "${expect.mustContainText}"`);
  }

  return { passed: reasons.length === 0, reasons };
}
