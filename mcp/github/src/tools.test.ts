import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { gitDiff } from "./tools.js";

const execFileAsync = promisify(execFile);

let repo: string;

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), "agentmesh-git-test-"));
  await execFileAsync("git", ["init", "-q"], { cwd: repo });
  await execFileAsync("git", ["config", "user.email", "test@example.com"], {
    cwd: repo,
  });
  await execFileAsync("git", ["config", "user.name", "Test"], { cwd: repo });
  await writeFile(join(repo, "file.txt"), "line one\n");
  await execFileAsync("git", ["add", "."], { cwd: repo });
  await execFileAsync("git", ["commit", "-q", "-m", "initial"], { cwd: repo });
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe("gitDiff", () => {
  test("returns an empty diff when there are no changes", async () => {
    const diff = await gitDiff({}, { root: repo });
    expect(diff).toBe("");
  });

  test("shows an unstaged change in the diff", async () => {
    await writeFile(join(repo, "file.txt"), "line one\nline two\n");

    const diff = await gitDiff({}, { root: repo });
    expect(diff).toContain("file.txt");
    expect(diff).toContain("+line two");
  });

  test("respects extra args like --stat", async () => {
    await writeFile(join(repo, "file.txt"), "line one\nline two\n");

    const diff = await gitDiff({ args: ["--stat"] }, { root: repo });
    expect(diff).toContain("file.txt");
    expect(diff).toContain("1 +");
  });

  test("rejects shell metacharacters as inert argv, not injected commands", async () => {
    // execFile passes args as argv, never through a shell — this string is
    // just a literal (and invalid) pathspec to git, not a shell injection.
    await expect(
      gitDiff({ args: ["--", "; rm -rf /"] }, { root: repo }),
    ).resolves.toBe("");
  });

  test("rejects a cwd that escapes the sandboxed root", async () => {
    await expect(gitDiff({ cwd: "../../etc" }, { root: repo })).rejects.toThrow(
      /escapes the sandboxed root/,
    );
  });
});
