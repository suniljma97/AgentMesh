import type { Client } from "@libsql/client";

/** Creates the eval_runs table (see Phase 4 of the implementation plan) if it doesn't exist. */
export async function ensureSchema(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS eval_runs (
      id TEXT PRIMARY KEY,
      agent TEXT NOT NULL,
      task_id TEXT NOT NULL,
      passed INTEGER NOT NULL,
      output TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}
