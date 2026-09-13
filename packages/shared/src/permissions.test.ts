import { describe, expect, test } from "bun:test";
import {
  assertToolAllowed,
  checkToolPermission,
  ToolPermissionError,
} from "./permissions.js";

describe("checkToolPermission", () => {
  test("read-only Phase 2 tools are allowed", () => {
    for (const tool of [
      "list_files",
      "read_file",
      "search_code",
      "git_diff",
      "run_tests",
    ]) {
      expect(checkToolPermission(tool)).toBe("allow");
    }
  });

  test("mutating tools require approval", () => {
    for (const tool of ["edit_file", "git_push", "delete_file"]) {
      expect(checkToolPermission(tool)).toBe("approval");
    }
  });

  test("production_db is denied", () => {
    expect(checkToolPermission("production_db")).toBe("deny");
  });

  test("an unrecognized tool defaults to approval, not allow", () => {
    expect(checkToolPermission("some_new_tool_nobody_registered")).toBe(
      "approval",
    );
  });
});

describe("assertToolAllowed", () => {
  test("does not throw for an allowed tool", () => {
    expect(() => assertToolAllowed("read_file")).not.toThrow();
  });

  test("throws ToolPermissionError for an approval-gated tool", () => {
    expect(() => assertToolAllowed("delete_file")).toThrow(ToolPermissionError);
  });

  test("throws ToolPermissionError for a denied tool", () => {
    expect(() => assertToolAllowed("production_db")).toThrow(
      ToolPermissionError,
    );
  });

  test("throws for an unrecognized tool rather than allowing it through", () => {
    expect(() => assertToolAllowed("rm_rf_everything")).toThrow(
      ToolPermissionError,
    );
  });
});
