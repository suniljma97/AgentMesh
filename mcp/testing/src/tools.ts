import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { assertToolAllowed, resolveWithinRoot } from "@agentmesh/shared";

const execFileAsync = promisify(execFile);

export interface TestingToolOptions {
  /** Directory the tool is sandboxed to. Defaults to the current working directory. */
  root?: string;
}

export interface RunTestsInput {
  /** Directory to run `bun test` in, relative to the sandboxed root. */
  cwd?: string;
  /** Extra `bun test` arguments (e.g. a file filter). */
  args?: string[];
}

export interface RunTestsResult {
  passed: boolean;
  exitCode: number;
  output: string;
}

interface ExecFileError {
  code?: number;
  stdout?: string;
  stderr?: string;
  message: string;
}

/**
 * Runs `bun test` via execFile with a fixed argv (never a shell string) —
 * same "no arbitrary shell command" rule as gitDiff. Never throws: a failing
 * test run is a normal, expected outcome and comes back as `passed: false`
 * with the captured output, not as a thrown error.
 *
 * `cwd` is resolved against `options.root` (default: process.cwd()) the same
 * way the filesystem tools sandbox `path` — otherwise a caller-supplied `cwd`
 * would let `bun test` (and anything it loads: bunfig.toml, preload scripts,
 * test files) run against an arbitrary directory on disk.
 */
export async function runTests(
  input: RunTestsInput = {},
  options: TestingToolOptions = {},
): Promise<RunTestsResult> {
  assertToolAllowed("run_tests");

  const root = options.root ?? process.cwd();
  const cwd = resolveWithinRoot(root, input.cwd);
  const args = ["test", ...(input.args ?? [])];

  try {
    const { stdout, stderr } = await execFileAsync("bun", args, {
      cwd,
      maxBuffer: 20 * 1024 * 1024,
    });
    return { passed: true, exitCode: 0, output: stdout + stderr };
  } catch (error) {
    const err = error as ExecFileError;
    return {
      passed: false,
      exitCode: err.code ?? 1,
      output: (err.stdout ?? "") + (err.stderr ?? "") || err.message,
    };
  }
}
