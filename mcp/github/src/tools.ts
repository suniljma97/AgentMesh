import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { assertToolAllowed, resolveWithinRoot } from "@agentmesh/shared";

const execFileAsync = promisify(execFile);

export interface GitToolOptions {
  /** Directory the tool is sandboxed to. Defaults to the current working directory. */
  root?: string;
}

export interface GitDiffInput {
  /** Repository directory to run `git diff` in, relative to the sandboxed root. */
  cwd?: string;
  /** Extra `git diff` arguments (e.g. ["--stat"], ["HEAD~1"], ["--", "src/"]). */
  args?: string[];
}

/**
 * Runs `git diff` via execFile with a fixed argv (never a shell string), so
 * arbitrary shell metacharacters in `args` can't be used for injection — the
 * Phase 2 security rule is "never let an agent reach an arbitrary shell command".
 *
 * `cwd` is resolved against `options.root` (default: process.cwd()) the same
 * way the filesystem tools sandbox `path`: the boundary is set by whoever
 * hosts the tool, not by the caller, so it can't be widened by passing an
 * absolute path elsewhere on disk.
 */
export async function gitDiff(
  input: GitDiffInput = {},
  options: GitToolOptions = {},
): Promise<string> {
  assertToolAllowed("git_diff");

  const root = options.root ?? process.cwd();
  const cwd = resolveWithinRoot(root, input.cwd);
  const args = ["diff", ...(input.args ?? [])];

  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`git diff failed: ${message}`);
  }
}
