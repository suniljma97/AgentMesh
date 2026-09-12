import { describe, expect, test } from "bun:test";
import { failResult, okResult } from "./index.js";

describe("okResult", () => {
  test("builds a completed result", () => {
    expect(okResult("done")).toEqual({
      status: "completed",
      message: "done",
      data: undefined,
    });
  });

  test("carries through optional data", () => {
    expect(okResult("done", { files: 3 })).toEqual({
      status: "completed",
      message: "done",
      data: { files: 3 },
    });
  });
});

describe("failResult", () => {
  test("builds a failed result", () => {
    expect(failResult("broke")).toEqual({
      status: "failed",
      message: "broke",
      data: undefined,
    });
  });
});
