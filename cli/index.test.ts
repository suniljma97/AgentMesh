import { describe, expect, test } from "bun:test";
import { parseTask } from "./index.js";

describe("parseTask", () => {
  test("extracts the task after the run command", () => {
    expect(parseTask(["run", "summarize this file"])).toBe(
      "summarize this file",
    );
  });

  test("joins multiple arguments with a space", () => {
    expect(parseTask(["run", "summarize", "this", "file"])).toBe(
      "summarize this file",
    );
  });

  test("returns undefined when the command is not run", () => {
    expect(parseTask(["summarize this file"])).toBeUndefined();
  });

  test("returns undefined when no task is given", () => {
    expect(parseTask(["run"])).toBeUndefined();
  });

  test("returns undefined for empty args", () => {
    expect(parseTask([])).toBeUndefined();
  });
});
