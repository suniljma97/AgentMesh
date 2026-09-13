import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createResearchTools } from "./tools.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "agentmesh-research-tools-test-"));
  await writeFile(
    join(root, "auth.ts"),
    "export function validateToken(token: string) { return token.length > 0; }\n",
  );
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("createResearchTools", () => {
  test("exposes exactly the three Phase 2 tools", () => {
    const tools = createResearchTools({ root });
    expect(Object.keys(tools).sort()).toEqual([
      "list_files",
      "read_file",
      "search_code",
    ]);
  });

  test("list_files reflects the real sandboxed repository", async () => {
    const tools = createResearchTools({ root });
    const result = await tools.list_files?.execute?.(
      {},
      { toolCallId: "1", messages: [] },
    );
    expect(result).toEqual(["auth.ts"]);
  });

  test("read_file returns real file contents", async () => {
    const tools = createResearchTools({ root });
    const result = await tools.read_file?.execute?.(
      { path: "auth.ts" },
      { toolCallId: "1", messages: [] },
    );
    expect(result).toContain("validateToken");
  });

  test("search_code finds a real match grounded in the repo", async () => {
    const tools = createResearchTools({ root });
    const result = await tools.search_code?.execute?.(
      { query: "validateToken" },
      { toolCallId: "1", messages: [] },
    );
    expect(result).toEqual([
      {
        file: "auth.ts",
        line: 1,
        text: expect.stringContaining("validateToken"),
      },
    ]);
  });

  test("read_file still refuses to escape the sandboxed root", async () => {
    const tools = createResearchTools({ root });
    await expect(
      tools.read_file?.execute?.(
        { path: "../../../etc/passwd" },
        { toolCallId: "1", messages: [] },
      ),
    ).rejects.toThrow(/escapes the sandboxed root/);
  });
});
