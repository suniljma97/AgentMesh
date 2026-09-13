import { type Client, createClient } from "@libsql/client";

/** Creates a fresh libSQL client for the given URL (e.g. "file:local.db", ":memory:"). */
export function createDb(url: string): Client {
  return createClient({ url });
}

/**
 * The shared local eval database — a plain file, matching the plan's "fully
 * local, no network dependency" cost target. Override with AGENTMESH_DB_URL
 * for a real Turso URL later.
 *
 * `defaultUrl` should be an absolute `file:` path when the caller cares where
 * it lands (e.g. eval/run.ts anchors it to the repo root via import.meta.dir)
 * — "file:local.db" on its own resolves against whatever the process's
 * current working directory happens to be, which differs between running
 * `bun run run.ts` directly and running it through turbo, silently
 * fragmenting eval history across two different files.
 *
 * Deliberately not cached/memoized: a singleton that silently ignored a
 * different `defaultUrl` on a later call (returning a client for the wrong
 * database with no warning) is worse than the small cost of opening a second
 * connection. Callers that need to share one instance should hold onto the
 * client they get back themselves.
 */
export function getDb(defaultUrl = "file:local.db"): Client {
  return createDb(process.env.AGENTMESH_DB_URL ?? defaultUrl);
}
