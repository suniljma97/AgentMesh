import { join } from "node:path";
import {
  ensureSchema,
  getDb,
  getPreviousEvalRun,
  recordEvalRun,
} from "@agentmesh/db";
import { createDefaultResearchAgent } from "@agentmesh/research-agent";
import { checkExpectation } from "./check.js";
import { researchAgentGoldenTasks } from "./golden-tasks/research-agent.js";

// process.cwd() is NOT reliably the repo root: turbo (and `cd eval && bun run
// eval`) run this script with eval/ itself as cwd, which would sandbox the
// Research Agent's tools to eval/ — every real file it's asked about would
// look "missing", and it'd exhaust its tool-call budget hunting for files
// that were never in scope. import.meta.dir anchors to this file's own
// location instead, so the root is correct regardless of invocation cwd.
const REPO_ROOT = join(import.meta.dir, "..");
const AGENT_NAME = "research";

async function main(): Promise<void> {
  // Pin the DB to the repo root explicitly — see the REPO_ROOT comment above;
  // the same cwd-vs-turbo mismatch applies to a bare "file:local.db" default.
  const db = getDb(`file:${join(REPO_ROOT, "local.db")}`);
  await ensureSchema(db);

  const agent = createDefaultResearchAgent({ root: REPO_ROOT });

  let failed = 0;
  let regressions = 0;

  console.log(
    `Running ${researchAgentGoldenTasks.length} golden tasks for "${AGENT_NAME}"...\n`,
  );

  for (const task of researchAgentGoldenTasks) {
    // Read the previous result *before* recording this run's — otherwise
    // it would just find the row we're about to insert.
    const previous = await getPreviousEvalRun(db, AGENT_NAME, task.id);

    const result = await agent.run({ task: task.input });
    const check =
      result.status === "completed"
        ? checkExpectation(result.message, task.expect)
        : { passed: false, reasons: [`Agent failed: ${result.message}`] };

    await recordEvalRun(db, {
      agent: AGENT_NAME,
      taskId: task.id,
      passed: check.passed,
      output: result.message,
    });

    console.log(`${check.passed ? "✅" : "❌"} ${task.id}: ${task.input}`);
    for (const reason of check.reasons) {
      console.log(`   - ${reason}`);
    }

    if (!check.passed) {
      failed += 1;

      if (previous?.passed) {
        regressions += 1;
        console.log("   ⚠️  REGRESSION: this task passed on the previous run");
      }
    }

    console.log("");
  }

  const passedCount = researchAgentGoldenTasks.length - failed;
  console.log(`${passedCount}/${researchAgentGoldenTasks.length} passed`);
  if (regressions > 0) {
    console.log(`⚠️  ${regressions} regression(s) vs. the previous run`);
  }

  if (failed > 0) {
    process.exitCode = 1;
  }

  db.close();
}

await main();
