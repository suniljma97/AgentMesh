import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Client } from "@libsql/client";
import { createDb } from "./client.js";
import {
  getPreviousEvalRun,
  listEvalRuns,
  recordEvalRun,
} from "./eval-runs.js";
import { ensureSchema } from "./schema.js";

let db: Client;

beforeEach(async () => {
  db = createDb(":memory:");
  await ensureSchema(db);
});

afterEach(() => {
  db.close();
});

describe("recordEvalRun", () => {
  test("inserts a row with a generated id and timestamp", async () => {
    const run = await recordEvalRun(db, {
      agent: "research",
      taskId: "research-001",
      passed: true,
      output: "found it",
    });

    expect(run.id).toBeTruthy();
    expect(run.createdAt).toBeTruthy();
    expect(run.agent).toBe("research");
    expect(run.taskId).toBe("research-001");
    expect(run.passed).toBe(true);
    expect(run.output).toBe("found it");
  });
});

describe("getPreviousEvalRun", () => {
  test("returns undefined when no run exists yet", async () => {
    const previous = await getPreviousEvalRun(db, "research", "research-001");
    expect(previous).toBeUndefined();
  });

  test("returns the most recent run for that agent+task", async () => {
    await recordEvalRun(db, {
      agent: "research",
      taskId: "research-001",
      passed: false,
      output: "first attempt",
    });
    await recordEvalRun(db, {
      agent: "research",
      taskId: "research-001",
      passed: true,
      output: "second attempt",
    });
    // A different task must not leak in.
    await recordEvalRun(db, {
      agent: "research",
      taskId: "research-002",
      passed: true,
      output: "unrelated",
    });

    const previous = await getPreviousEvalRun(db, "research", "research-001");
    expect(previous?.output).toBe("second attempt");
    expect(previous?.passed).toBe(true);
  });
});

describe("listEvalRuns", () => {
  test("returns all runs for a task, newest first", async () => {
    await recordEvalRun(db, {
      agent: "research",
      taskId: "research-001",
      passed: false,
      output: "attempt 1",
    });
    await recordEvalRun(db, {
      agent: "research",
      taskId: "research-001",
      passed: true,
      output: "attempt 2",
    });

    const runs = await listEvalRuns(db, "research", "research-001");
    expect(runs).toHaveLength(2);
    expect(runs[0]?.output).toBe("attempt 2");
    expect(runs[1]?.output).toBe("attempt 1");
  });
});
