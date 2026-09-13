import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";

export interface EvalRun {
  id: string;
  agent: string;
  taskId: string;
  passed: boolean;
  output: string;
  createdAt: string;
}

export interface RecordEvalRunInput {
  agent: string;
  taskId: string;
  passed: boolean;
  output: string;
}

/** Inserts one eval run row. Never updates/dedupes — every run is a new row, so history is a query away. */
export async function recordEvalRun(
  db: Client,
  input: RecordEvalRunInput,
): Promise<EvalRun> {
  const run: EvalRun = {
    id: randomUUID(),
    agent: input.agent,
    taskId: input.taskId,
    passed: input.passed,
    output: input.output,
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: "INSERT INTO eval_runs (id, agent, task_id, passed, output, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      run.id,
      run.agent,
      run.taskId,
      run.passed ? 1 : 0,
      run.output,
      run.createdAt,
    ],
  });

  return run;
}

function rowToEvalRun(row: Record<string, unknown>): EvalRun {
  return {
    id: String(row.id),
    agent: String(row.agent),
    taskId: String(row.task_id),
    passed: Number(row.passed) === 1,
    output: String(row.output),
    createdAt: String(row.created_at),
  };
}

// created_at has millisecond resolution and two runs in a tight loop (or a
// unit test) can land in the same millisecond — rowid (SQLite's implicit,
// strictly-insertion-order column) breaks the tie so "most recent" is never
// ambiguous. Call getPreviousEvalRun() *before* recording the new run: it
// always means "the latest run that already existed", not a timestamp cutoff.

/** The most recent run already recorded for a given agent+task, if any. */
export async function getPreviousEvalRun(
  db: Client,
  agent: string,
  taskId: string,
): Promise<EvalRun | undefined> {
  const result = await db.execute({
    sql: `SELECT id, agent, task_id, passed, output, created_at, rowid FROM eval_runs
          WHERE agent = ? AND task_id = ?
          ORDER BY rowid DESC LIMIT 1`,
    args: [agent, taskId],
  });

  const row = result.rows[0];
  return row
    ? rowToEvalRun(row as unknown as Record<string, unknown>)
    : undefined;
}

/** All runs for a given agent+task, newest first. */
export async function listEvalRuns(
  db: Client,
  agent: string,
  taskId: string,
): Promise<EvalRun[]> {
  const result = await db.execute({
    sql: `SELECT id, agent, task_id, passed, output, created_at, rowid FROM eval_runs
          WHERE agent = ? AND task_id = ?
          ORDER BY rowid DESC`,
    args: [agent, taskId],
  });

  return result.rows.map((row) =>
    rowToEvalRun(row as unknown as Record<string, unknown>),
  );
}
