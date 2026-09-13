export type PermissionLevel = "allow" | "approval" | "deny";

/**
 * Tool permission table (Phase 2 security rule): an agent must never reach a shell
 * command directly — every tool call goes through this check first. Read-only /
 * side-effect-free tools are ALLOW; anything that mutates state needs human APPROVAL;
 * anything touching production is DENY outright, with no path to approve around it.
 */
export const TOOL_PERMISSIONS: Record<string, PermissionLevel> = {
  list_files: "allow",
  read_file: "allow",
  search_code: "allow",
  git_diff: "allow",
  run_tests: "allow",

  edit_file: "approval",
  git_push: "approval",
  delete_file: "approval",

  production_db: "deny",
};

export class ToolPermissionError extends Error {
  constructor(
    public readonly tool: string,
    public readonly level: PermissionLevel,
  ) {
    super(
      level === "deny"
        ? `Tool "${tool}" is denied and can never run automatically`
        : `Tool "${tool}" requires human approval before it can run`,
    );
    this.name = "ToolPermissionError";
  }
}

/**
 * Looks up a tool's permission level. Unknown tools default to "approval" rather
 * than "allow" — an unrecognized tool must never be silently permitted to run.
 */
export function checkToolPermission(tool: string): PermissionLevel {
  return TOOL_PERMISSIONS[tool] ?? "approval";
}

/** Throws unless the tool's permission level is "allow". */
export function assertToolAllowed(tool: string): void {
  const level = checkToolPermission(tool);
  if (level !== "allow") {
    throw new ToolPermissionError(tool, level);
  }
}
