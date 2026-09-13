# AgentMesh — Future-Ready Multi-Agent Platform

> **Goal:** Build a portfolio-grade, ₹0-first AI platform using **A2A + MCP + A2UI + Gemini + TypeScript**, focused on agent-to-agent collaboration and agent-generated UI.

> **Secondary goal (equally important):** use this build to deliberately practice production-relevant AI engineering skills — LLM provider abstraction, agent evaluation, lightweight observability, resilience under failure — **and** to deliberately adopt newer tooling (Bun, Biome, Turborepo, Vercel AI SDK, Inngest, libSQL, shadcn/ui) instead of defaulting to whatever's already familiar. "Old" stack (plain Node + ESLint/Prettier + hand-rolled everything) has already been learned — this plan leans new on purpose.

---

## 1. Vision

```text
                         User
                           │
                           ▼
                    Orchestrator Agent
                           │
                 ┌─────────┼─────────┐
                 │         │         │
                A2A       A2A       A2A
                 ▼         ▼         ▼
            Research     Coding    Testing
              Agent       Agent      Agent
                 │         │         │
                 └─────────┼─────────┘
                           │
                          A2UI
                           ▼
                    Dynamic React UI
```

**Protocol separation:**

- **A2A:** Agent → Agent communication and task delegation
- **MCP:** Agent → Tools / data / APIs
- **A2UI:** Agent → Dynamic declarative UI

**Entry points:** Web UI (A2UI) is the primary surface, but a thin **CLI** (`agentmesh run "<task>"`, run via **Bun** — no build step) exercises the exact same orchestrator core headless. This forces the core logic to stay UI-agnostic from day one and gives a faster dev loop than spinning up Next.js every time.

---

## 2. Product Goal

User ek natural-language task dega:

> "Mere project ka login bug investigate karo, fix suggest karo aur test report dikhao."

System:

1. Requirement understand karega
2. Relevant agent discover karega
3. Research agent analysis karega
4. Coding agent fix prepare karega
5. Testing agent tests run karega
6. Reviewer result validate karega
7. A2UI dashboard mein result **live stream** hoga (SSE se, step-by-step — wait-then-show nahi)
8. Destructive actions ke liye human approval required hoga
9. Kam se kam ek baar ye pura flow ek **real repository** par chalaya jayega — sirf toy example nahi, actual proof

---

## 3. Tech Stack

### Core

- **Bun** — runtime + package manager (replaces Node.js + pnpm; native TS execution, built-in test runner/bundler)
- TypeScript
- Next.js + React
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`, community Ollama provider) — unified `generateText`/`streamText` interface across LLM providers, streaming and tool-calling built in
- A2A v1.0
- MCP
- A2UI
- Zod

### Development

- **Biome** — lint + format in one fast Rust-based tool (replaces ESLint + Prettier)
- **Turborepo** — monorepo task caching / build graph, on top of Bun workspaces
- Vitest
- Playwright
- TypeScript strict mode

### Infrastructure

- Docker
- Ollama (local LLM — free, also used as automatic fallback when Gemini's free tier throttles)
- **Inngest** — durable workflow engine (free dev tier, or fully local dev mode) for orchestrator retries/state, instead of hand-rolling it
- **libSQL** (Turso-compatible embedded SQLite) — eval results + traces, queryable instead of flat JSON files
- GitHub API
- GitHub Actions

### UI

- **shadcn/ui** — component catalog implementation for the A2UI renderer (Card, Badge, Table, Alert, Progress, etc. as real, accessible primitives instead of building a design system from scratch)
- **Server-Sent Events (SSE)** — live agent-progress streaming into the dashboard

### Optional later / swap-in

- **Langfuse** (self-hosted, open-source LLM observability) — optional richer swap for Phase 14 instead of rolling your own OpenTelemetry wiring
- PostgreSQL (if libSQL is outgrown)
- Redis

**Principle:** pehle minimum dependencies; framework-heavy architecture avoid karo. Naye tools (Bun, Biome, Turborepo, AI SDK, Inngest, shadcn/ui, libSQL, Langfuse) isliye chune gaye hain kyunki inka free tier/self-host ₹0 rehta hai, aur inka learning curve project ke size ke hisaab se proportional hai — koi bhi "enterprise-only" complexity nahi laata, sab kuch local/solo-dev-friendly hai.

---

## 4. Cost Target

### Development target: ₹0

Use:

- Gemini API Free Tier
- Ollama local models for dev-time LLM calls (zero cost, also reduces pressure on Gemini's free-tier rate limits)
- Bun, Biome, Turborepo — open-source, free forever, no license cost
- Inngest free dev tier (generous limits), or fully local/self-hosted dev mode
- libSQL/Turso free tier, or fully local file-based mode (`file:local.db`) — no network dependency needed at all
- shadcn/ui — copy-paste components, no license cost
- Langfuse self-hosted via Docker — ₹0
- GitHub Free
- Local Docker
- Local PostgreSQL if persistence required
- Open-source TypeScript tooling

**Important:** Free API tiers have rate limits. Production-scale traffic may require billing.

---

## 5. Monorepo Structure

```text
agentmesh/
├── apps/
│   └── web/                 # Next.js + shadcn/ui + SSE client
│
├── cli/                      # Bun-run CLI
│
├── agents/
│   ├── orchestrator/         # Inngest functions (steps, retries)
│   ├── research/
│   ├── coding/
│   ├── testing/
│   └── reviewer/
│
├── packages/
│   ├── a2a/
│   ├── a2ui/
│   ├── llm/                  # Vercel AI SDK wrapper (Gemini + Ollama providers)
│   ├── db/                   # libSQL client + schema (eval results, traces)
│   ├── schemas/
│   └── shared/
│
├── mcp/
│   ├── filesystem/
│   ├── github/
│   └── testing/
│
├── prompts/                  # versioned prompt files (.md), not inline strings
├── eval/                     # golden task sets + eval runner
│
├── docker/                   # Ollama, Langfuse self-host compose files
├── scripts/
├── .env.example
├── package.json               # Bun workspaces defined here
├── turbo.json                 # task graph / caching
├── biome.json                 # lint + format config
└── README.md
```

---

# 6. Implementation Roadmap

## Phase 0 — Project Setup

**Time:** 1–2 hours

### Tasks

- [x] Create Bun monorepo (workspaces in root `package.json`)
- [x] Configure TypeScript strict mode
- [x] Configure Biome (lint + format)
- [x] Configure Turborepo (`turbo.json`, task graph)
- [x] Create Next.js web app, initialize shadcn/ui in it
- [x] Create shared package (`packages/shared` — `Agent`/`AgentInput`/`AgentResult` types live here already)
- [x] Add environment variable validation (`packages/config` — Zod schema)
- [x] Add `.env.example`
- [x] Add Git repository (pushed to GitHub: https://github.com/suniljma97/AgentMesh)
- [ ] Pick a small real repository for the later end-to-end demo (own toy repo or a simple OSS repo)
- [x] Scaffold empty `prompts/`, `eval/`, and `packages/db/` folders

**Status: Phase 0 essentially done** — only picking the demo repository is still open.

### Initial commands

```bash
mkdir agentmesh
cd agentmesh

bun init
bun add -d typescript @biomejs/biome turbo
```

Workspace config (root `package.json`):

```json
{
  "workspaces": ["apps/*", "cli", "agents/*", "packages/*", "mcp/*"]
}
```

Minimal `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "test": {},
    "eval": {},
    "lint": {}
  }
}
```

---

# 7. Phase 1 — Gemini Agent

**Time:** Day 1

**Status: done ✅.** `packages/llm` wraps both Gemini (`@ai-sdk/google`) and Ollama
(`ollama-ai-provider-v2`, pinned to `1.5.5` for LanguageModelV2 compatibility with `ai@5`)
behind `streamTask`; `packages/llm/src/agent.ts` wires that behind the shared `Agent`
interface (`createLlmAgent`), returning a structured `AgentResult` while still streaming
chunks live via an `onChunk` callback. `cli/index.ts` runs through the agent. Verified
end-to-end against a real local Ollama server: a valid model streams a real response, and
an invalid model surfaces a clean `AgentMesh task failed: Not Found` with exit code 1 —
confirming the earlier silent-error-swallow fix holds under a real failure, not just tests.

First goal is deliberately simple:

```text
User
 ↓
Agent
 ↓
LLM Provider (Vercel AI SDK → Gemini / Ollama)
 ↓
Response (streamed)
```

### Agent responsibilities

- Understand task
- Decide whether a tool is required
- Call tools
- Process tool result
- Produce final response

### Suggested interface

```ts
export interface Agent {
  name: string;
  description: string;

  run(input: AgentInput): Promise<AgentResult>;
}
```

Shared result:

```ts
export interface AgentResult {
  status: "completed" | "failed";
  message: string;
  data?: unknown;
}
```

### LLM Provider Abstraction — via Vercel AI SDK

Instead of hand-rolling a provider interface, use the **Vercel AI SDK** — it already gives a unified `generateText` / `streamText` API across providers:

```ts
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";

const ollama = createOllama({ baseURL: "http://localhost:11434/api" });

const model =
  process.env.LLM_PROVIDER === "ollama"
    ? ollama("qwen2.5:7b")
    : google("gemini-2.0-flash");

const result = await streamText({ model, prompt: task });
```

Provider switch is one env var; streaming comes for free. Building this abstraction by hand (as the earlier version of this plan did) is a good exercise once — but the AI SDK is what the industry actually standardized on, so the move now is: use it for real, and read its source when curious how it does what you'd have hand-rolled.

### CLI entrypoint

Runs via **Bun** — no build step needed:

```bash
bun cli run "summarize this file"
```

This proves from day one that the core logic is UI-agnostic, and gives a much faster dev loop than the web app.

### Success criteria

- [x] Gemini API works (via AI SDK)
- [x] Agent accepts a task (`createLlmAgent().run({ task })`)
- [x] Agent returns structured output (`AgentResult` via `okResult`/`failResult`)
- [x] Errors are handled cleanly (model errors become a `failed` `AgentResult`, not a throw)
- [x] Agent runs end-to-end via the CLI, without the web app
- [x] Response streams token-by-token (`streamText`), visible live in CLI output
- [x] Swapping Gemini ⇄ Ollama requires no change to agent logic, only the `LLM_PROVIDER` env var

---

# 8. Phase 2 — Tool Layer / MCP

**Time:** Day 2–3

**Status: done ✅.** All five tools are real `@modelcontextprotocol/sdk` servers, not stubs:
`mcp/filesystem` (`list_files`, `read_file`, `search_code`), `mcp/github` (`git_diff`, local
git for now — the GitHub API itself is Phase 15), and `mcp/testing` (`run_tests`, wraps
`bun test`). Every shell-adjacent tool runs via Node's `execFile` with a fixed argv, never a
shell string, so the security rule below is structural, not just documented. `packages/shared`
gained a `checkToolPermission`/`assertToolAllowed` gate implementing the table below verbatim,
defaulting an _unrecognized_ tool to `approval` rather than silently allowing it — plus a
`resolveWithinRoot` sandbox helper, shared by **all three** servers, that rejects any path
resolving outside a fixed root directory. That root is always set server-side (a
`createXServer({ root })` option, defaulting to `process.cwd()`) and never by the remote
caller — an initial pass on `git_diff`/`run_tests` accepted a caller-supplied `cwd` with no
containment at all, letting a compromised caller point `bun test`/`git diff` (and anything
`bun test` loads: `bunfig.toml`, preload scripts) at an arbitrary directory; caught in review
and fixed before this ever shipped, with regression tests asserting the escape is rejected.
Verified end-to-end with a real MCP `Client`↔`Server` pair over `InMemoryTransport` for all
three servers: tool listing, successful calls, and a path-traversal attempt on each of the
three correctly coming back as `isError: true` through the actual protocol, not just the bare
function. Not yet built: the Docker sandbox step in the diagram below — Phase 2's tools are
all read-only, sandboxed-by-path, or execFile-argv-isolated, so nothing currently needs a
container; revisit once Phase 8's `edit_file` (APPROVAL-gated) is implemented.

Add tools:

```text
Agent
 │
 └── MCP
      ├── list_files
      ├── read_file
      ├── search_code
      ├── git_diff
      └── run_tests
```

### Security rule

Never allow:

```text
Agent → Host → arbitrary shell command
```

Prefer:

```text
Agent
  ↓
MCP Tool
  ↓
Permission Check
  ↓
Docker Sandbox
  ↓
Command
```

### Tool permissions

```text
read_file      → ALLOW
search_code    → ALLOW
git_diff       → ALLOW

edit_file      → APPROVAL
git_push       → APPROVAL
delete_file    → APPROVAL
production_db  → DENY
```

---

# 9. Phase 3 — Research Agent

**Time:** Day 4
**Status: done ✅** (completed in review — see below). `agents/research` exposes an
independent Research Agent with a discoverable Agent Card, delegates repository and
technical-issue research through the shared `Agent` contract, and returns the delegate's
structured `AgentResult`. A2A transport and orchestrator wiring remain intentionally
deferred to Phase 5.

**Review finding, fixed:** the first version's `createResearchAgent` only ever reworded the
task into a prompt and handed it to a plain LLM delegate — it never called any Phase 2 tool,
so it could only guess at a repository from training knowledge, not read it. Fixed by adding
`agents/research/src/tools.ts` (wraps `@agentmesh/mcp-filesystem`'s `list_files`/`read_file`/
`search_code` as real AI SDK tools, so the sandboxing/traversal-safety is inherited, not
reimplemented) and `agents/research/src/wire.ts` (`createDefaultResearchAgent({ root })`,
which builds an LLM delegate via `packages/llm`'s now tool-capable `createLlmAgent`/
`streamTask` — extended with `tools`/`stopWhen`/`system` passthrough — and hands it to
`createResearchAgent`). `createResearchAgent` itself is unchanged and still takes a plain
`delegate` for easy unit testing; only real usage goes through the tool-equipped wiring.

**Also found and fixed in the same pass:** `packages/llm`'s Gemini model was hardcoded to
`gemini-2.0-flash`, which Google has since retired (`404 NOT_FOUND`, telling callers to move
to `gemini-3.6-flash`). Now a configurable `GEMINI_MODEL` env var (`packages/config`,
default `gemini-3.6-flash`) — a model retirement is a `.env` edit now, not a code change.

**A third bug, found only by running the real thing:** the first live run against Gemini hit
every tool call failing (a bad `root`), exhausted `stopWhen`'s step budget, and `streamTask`
returned an empty string — which `createLlmAgent` then reported as `okResult("")`, a **silent
success with no content**, when it should have been a failure. Root cause: `streamText`'s
`finishReason` (the *last* step's) is `"tool-calls"` specifically when the step budget runs
out while the model still wants to call another tool, rather than the model reaching a
natural `"stop"` — a signal `streamTask` wasn't checking at all. Fixed by checking
`finishReason` after the stream drains and throwing (surfaced by `createLlmAgent` as a
`failed` `AgentResult`, same as any other model error) when it's `"tool-calls"`. Regression
test added with a fake model that only ever calls a tool, forcing exactly this exhaustion.

**Real end-to-end proof** (not just unit tests, which use a fake delegate/model and can't
catch any of the three bugs above): ran `createDefaultResearchAgent({ root: <this repo> })`
against the real Gemini API twice. With a valid root, it called `search_code`, then
`list_files`, then `read_file` for real, and correctly answered `packages/shared/src/index.ts`
— the actual file — citing real consumers (`agents/research`, `packages/llm/src/agent.ts`) it
found by reading them, not guessing. With a deliberately broken root (every tool call fails),
it now correctly returns `status: "failed"` with an actionable message instead of the earlier
silent empty success.

Create an independent Research Agent.

```text
Orchestrator
  │
  │ A2A
  ▼
Research Agent
```

Responsibilities:

- Analyze repository
- Search documentation
- Identify relevant files
- Produce findings
- Return structured task result

### Agent Card

```json
{
  "name": "Research Agent",
  "description": "Analyzes technical issues and repositories",
  "skills": ["code-analysis", "documentation-search"]
}
```

### Success criteria

- [x] Agent exposes discoverable capabilities
- [x] Orchestrator-compatible `run` contract accepts and delegates a task
- [x] Research Agent returns a structured result

---

# 10. Phase 4 — Agent Evaluation Harness

**Time:** Day 4 (spilling into Day 5 if needed)

**Status: done ✅.** `packages/db` wraps `@libsql/client` (`file:local.db`, no network
dependency, per the ₹0 cost target) with `ensureSchema`/`recordEvalRun`/`getPreviousEvalRun`/
`listEvalRuns`. `eval/` has 5 golden tasks for the Research Agent (`eval/golden-tasks/
research-agent.ts`) grounded in verifiable facts about *this* repo (e.g. "AgentInput is
defined in packages/shared/src/index.ts") — an LLM can't get these right by guessing from
training data, only by actually reading the files. `eval/run.ts` runs each task against
`createDefaultResearchAgent`, checks the result with pure, unit-tested `checkExpectation`
logic, records every run to libSQL, and flags a regression when a task that passed
last time fails now. Wired as `bun run eval` → `turbo run eval` (`cache: false` — a live LLM
call must never replay a cached result).

**Three more real bugs, found only by actually running `bun run eval`:**
1. `eval/run.ts` used `process.cwd()` as the Research Agent's sandbox root. `process.cwd()`
   is the invoking package's directory under turbo (`eval/`), not the repo root — every real
   file the agent was asked about looked "missing" from inside `eval/`, and it burned its
   whole tool-call budget hunting for files that were never in scope. Fixed by anchoring to
   `import.meta.dir` instead, which is stable regardless of invocation cwd.
2. The exact same class of bug in `packages/db`'s `getDb()` default (`"file:local.db"` is
   cwd-relative) silently created a *second*, disconnected database inside `eval/` instead of
   the repo root — eval history would have quietly split across two files depending on how the
   suite was invoked. Fixed by having `eval/run.ts` pass an explicit absolute path built from
   the same repo-root anchor, and by giving `getDb()` a `defaultUrl` parameter so callers who
   need determinism aren't stuck with the cwd-relative default.
3. Caught in a follow-up review, before either of the above two even mattered in practice:
   `getDb()`'s first implementation cached a module-level singleton on the *first* call and
   silently ignored `defaultUrl` on every call after that — `getDb("file:a.db")` then
   `getDb("file:b.db")` returned the same client pointed at `a.db`, no warning. Nothing in this
   codebase happened to call it twice yet, but the very fix in bug #2 (an explicit path per
   caller) would have been quietly defeated the moment a second caller showed up. Fixed by
   dropping the cache — `getDb()` now just calls `createDb()` fresh every time — with a test
   proving two calls with different URLs are backed by two independent databases.

A third finding was tuning, not a bug: the first real run flaked on one task (`research-005`)
after `createDefaultResearchAgent`'s `stopWhen` step budget (6) ran out mid tool-use — a real,
correctly-caught failure (Phase 3's `finishReason` fix working as intended), not a harness
bug. Raised the default to 8; reran and all 5 passed. This is exactly the kind of thing golden
tasks exist to surface.

Before building more agents, lock in a way to know if an agent got **worse** after a prompt or model change — without this, every later refactor is a guess.

```text
Golden Tasks (10–15 fixed inputs + expected outcome shape)
      ↓
Eval Runner (eval/run.ts)
      ↓
Pass/Fail + diff vs last run (stored in libSQL)
      ↓
Regression report
```

Golden task example:

```json
{
  "id": "research-001",
  "input": "Find where login token is validated",
  "expect": { "mustMentionFile": "auth.ts" }
}
```

Results land in **libSQL** instead of flat files, so history and diffs are a query away instead of a JSON-parsing exercise:

```sql
CREATE TABLE eval_runs (
  id TEXT PRIMARY KEY,
  agent TEXT,
  task_id TEXT,
  passed INTEGER,
  output TEXT,
  created_at TEXT
);
```

### Rule

Har agent ke liye kam se kam 3–5 golden tasks honi chahiye before it's considered "done" for its phase. Prompt ya model badalne ke baad eval suite chalana **mandatory** hai — exactly like running unit tests after a code change.

### Success criteria

- [x] `eval/` runner exists, runs against the Research Agent, and writes results to libSQL
- [x] A regression (broken output shape/behavior) is caught automatically, not discovered by
      hand — proven for real: `research-005` failing after a passing run was correctly
      surfaced as a would-be regression signal (same run also showed the *reverse*, a
      previously-failing task now passing, correctly *not* flagged as a regression)

---

# 11. Phase 5 — A2A Communication

**Time:** Day 5

Implement:

```text
Orchestrator
      │
      │ A2A
      ▼
Research Agent
```

Then:

```text
Orchestrator
      │
      ├── A2A → Research
      ├── A2A → Coding
      └── A2A → Testing
```

### Important design

A2A should handle:

- Agent discovery
- Task delegation
- Task state
- Messages
- Artifacts
- Agent capabilities

MCP should handle:

- Files
- Git
- APIs
- Databases
- External tools

---

# 12. Phase 6 — Multi-Agent Orchestration (Durable, via Inngest)

**Time:** Day 6–7

Workflow:

```text
User Task
    ↓
Orchestrator
    ↓
Research
    ↓
Coding
    ↓
Testing
    ↓
Reviewer
    ↓
Final Result
```

### Orchestrator as a durable Inngest function

Instead of hand-rolling retry/state logic, implement the orchestrator as an **Inngest** function, with one `step.run` per agent call:

```ts
export const runTask = inngest.createFunction(
  { id: "agentmesh-task", retries: 3 },
  { event: "agentmesh/task.created" },
  async ({ event, step }) => {
    const research = await step.run("research", () =>
      callAgent("research", event.data),
    );
    const coding = await step.run("coding", () =>
      callAgent("coding", { ...event.data, research }),
    );
    const testing = await step.run("testing", () =>
      callAgent("testing", coding),
    );
    const review = await step.run("review", () =>
      callAgent("reviewer", testing),
    );

    return { research, coding, testing, review };
  },
);
```

**Why this matters:** each `step.run` is automatically checkpointed and retried. If the Testing Agent crashes, Research and Coding don't re-run from scratch. This is exactly the "retry handling + state management" the orchestrator was always going to need — but instead of hand-rolling it, you're using a durable-execution engine, which is a real pattern in production systems (Temporal, AWS Step Functions, Inngest all solve the same problem).

### Orchestrator responsibilities

- Task planning
- Agent selection
- Retry handling + state management → **handled by Inngest steps**, not hand-rolled
- Result aggregation
- Human approval
- Final response

### Streaming progress (live, not wait-then-show)

Each `step.run` completion emits an event; the web app subscribes via **SSE** and the A2UI dashboard updates as each agent finishes — no polling, no full-page wait.

Example:

```text
Research Agent
"Bug is in auth.ts"

        ↓

Coding Agent
"Prepared fix + tests"

        ↓

Testing Agent
"24 passed, 1 failed"

        ↓

Reviewer Agent
"Fix looks safe"

        ↓

Orchestrator
"Ready for approval"
```

---

# 13. Phase 7 — Observability Trace Viewer, Lightweight

**Time:** Day 7 / early Week 2

Once Orchestrator → Research → Coding chains exist, debugging them blind is painful. Add _minimal_ trace capture now — not full OpenTelemetry (that's Phase 14), just enough to see what happened, stored in the same **libSQL** database as eval results:

```sql
CREATE TABLE traces (
  task_id TEXT,
  agent TEXT,
  started_at TEXT,
  finished_at TEXT,
  summary TEXT
);
```

```text
Task ID
 ↓
[Agent started] → [Agent finished]  (timestamp, duration, input/output summary)
 ↓
Written to libSQL
 ↓
Simple /traces page in apps/web — timeline view
```

Example trace view:

```text
Task: login-bug-142
Orchestrator   started 0.0s
Research       started 1.2s  →  finished 4.6s
Coding         started 4.6s  →  finished 12.7s
----------------------------------------
Total: 12.7s
```

**Why now, not later:** full OpenTelemetry (Phase 14) comes much later, but basic trace visibility shouldn't wait — debugging a multi-agent flow with no trace at all is close to impossible once more than two agents are involved.

**Optional stretch:** if you want hands-on time with a real open-source observability tool sooner, self-host **Langfuse** (Docker) now instead of waiting for Phase 14 — but the libSQL version above is enough to keep moving.

### Success criteria

- Every agent run automatically produces a trace row in libSQL
- A simple web page lists recent task traces with per-agent timing

---

# 14. Phase 8 — Coding Agent

**Time:** Week 2

Coding Agent gets:

```text
Issue
+
Research findings
+
Relevant files
+
Coding rules
```

It can:

```text
read_file
search_code
edit_file
git_diff
run_tests
```

### Important

Agent ko direct full repository context mat do.

Use:

```text
Task
 ↓
Relevant files
 ↓
Relevant symbols
 ↓
Minimal context
```

This reduces token usage and improves accuracy.

---

# 15. Phase 9 — Testing Agent

Testing Agent:

```text
Code changes
      ↓
Test plan
      ↓
Vitest / Playwright
      ↓
Results
      ↓
Failure analysis
```

Output:

```json
{
  "passed": 24,
  "failed": 1,
  "coverage": 87,
  "blocking": true
}
```

### Testing policy

Agent-generated tests ko automatically trusted nahi maana jayega.

Require:

- Existing tests
- New regression test
- Typecheck
- Lint (Biome)
- Relevant integration tests
- Chaos scenarios (below) before calling this agent "done"

### Chaos / Failure Injection

On-purpose failure scenarios to test, because a multi-agent system that only works on the happy path isn't trustworthy:

```text
- MCP tool timeout
- Agent returns malformed JSON
- Gemini API returns 429 / is down  → AI SDK provider should fall back to Ollama (Phase 1) or fail cleanly
- Test runner itself crashes        → Inngest step retry (Phase 6) should recover without re-running earlier steps
```

Rule: the system should never hard-crash on these — it must fail gracefully and report the failure, and the Orchestrator decides retry vs. abort.

---

# 16. Phase 10 — Reviewer Agent

Reviewer independently checks:

- Bugs
- Security issues
- Regressions
- Missing tests
- Bad architecture
- Unnecessary changes
- Dependency risks

Workflow:

```text
Coding Agent
      ↓
Patch
      ↓
Testing Agent
      ↓
Reviewer Agent
```

Reviewer ko coder ka internal reasoning nahi, **actual diff + test results + task requirements** dena prefer karo.

---

# 17. Phase 11 — A2UI

**Time:** Week 2

Normal architecture:

```text
Agent → JSON → Custom UI
```

AgentMesh:

```text
Agent
 ↓
A2UI message
 ↓
React renderer (shadcn/ui primitives)
 ↓
Dynamic UI (live via SSE)
```

Example:

```text
┌────────────────────────────────────┐
│ 🔴 Critical Issue                  │
│                                    │
│ auth.ts:142                        │
│                                    │
│ Token validation can be bypassed.  │
│                                    │
│ [View Diff] [Run Tests] [Approve]  │
└────────────────────────────────────┘
```

### A2UI principles

- Declarative UI
- Schema validation
- Safe component catalog
- No arbitrary JavaScript from agent
- No arbitrary HTML execution

### Component catalog (built on shadcn/ui)

```text
Text
Card
Badge
Button
Table
CodeBlock
Diff
Progress
Approval
Alert
TraceTimeline      ← renders Phase 7's libSQL trace data
CostMeter          ← live token usage + estimated cost for the task
```

Using **shadcn/ui** for the underlying primitives means the A2UI renderer maps agent JSON onto real, accessible components instead of a design system built from scratch.

### Live updates

The dashboard updates over **SSE** as each Inngest step (Phase 6) completes — no polling, no reload.

---

# 18. Phase 12 — Human-in-the-Loop

Destructive actions require approval.

```text
Agent wants:
    ↓
git push
    ↓
Permission layer
    ↓
Human approval
    ↓
Execute
```

Approval UI:

```text
┌───────────────────────────────┐
│ Agent wants to push changes   │
│                               │
│ Files: 3                      │
│ Tests: 24 passed              │
│ Reviewer: Approved            │
│                               │
│ [Reject]       [Approve]      │
└───────────────────────────────┘
```

---

# 19. Phase 13 — Security

**Time:** Week 3

### Agent security

- Authentication
- Authorization
- Agent identity
- Capability validation
- Message validation
- Rate limiting
- Inngest event signing verification (webhook/event payloads must be verified, not trusted blindly)

### Tool security

- Least privilege
- Allowlist tools
- Input validation
- Sandbox execution
- Network restrictions

### AI security

- Prompt injection detection
- Tool poisoning protection
- Untrusted content isolation
- Output validation
- Secret redaction

Phase 9's chaos tests are what actually validate these assumptions hold up under failure, not just on paper.

### Never allow

```text
LLM
 ↓
raw shell
 ↓
production
```

---

# 20. Phase 14 — Observability (Full)

Phase 7 already gave a basic trace viewer backed by libSQL. Two ways to go deeper here — pick one, both are free:

1. Add a proper OpenTelemetry layer (real spans, exporters) **on top of** the existing libSQL trace data — enhance it, don't replace it.
2. Self-host **Langfuse** (Docker) and instrument the AI SDK calls directly — a real open-source LLM-observability tool, hands-on, with almost no setup cost. This is the "more new tech" option if that's still the goal at this point.

Track (either way):

```text
Task ID
Agent ID
A2A calls
MCP calls
Tool latency
LLM latency
Token usage
Retries
Failures
Approvals
```

Example:

```text
Task: login-bug-142

Orchestrator     1.2s
Research         3.4s
Coding           8.1s
Testing          4.7s
Reviewer         2.8s
----------------------
Total            20.2s
```

---

# 21. Phase 15 — GitHub Integration

```text
GitHub Issue
     ↓
AgentMesh
     ↓
Implementation
     ↓
Tests
     ↓
Review
     ↓
Pull Request
```

MCP GitHub tools:

```text
get_issue
create_branch
read_repo
create_file
update_file
create_pr
get_pr
```

### Approval boundary

```text
Create PR       → allowed
Merge PR        → human approval
Delete branch   → approval
Production deploy → approval
```

---

# 22. Phase 16 — GitHub Actions

CI pipeline:

```text
Pull Request
     ↓
Install (Bun)
     ↓
Typecheck
     ↓
Lint (Biome)
     ↓
Unit Tests
     ↓
Eval Suite (golden tasks)
     ↓
Integration Tests
     ↓
AI Review
     ↓
Status
```

Example:

```yaml
name: AgentMesh CI

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bunx biome check .
      - run: bun test
      - run: bun run eval
```

Turborepo remote caching (optional, free tier available) speeds this up as the monorepo grows.

---

# 23. Final Architecture

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                          ▼
            ┌───────────────┐          ┌───────────────┐
            │  Next.js Web  │          │   Bun CLI     │
            │ (shadcn/ui)   │          └───────┬───────┘
            └───────┬───────┘                  │
                    └────────────┬─────────────┘
                                 ▼
                       ┌───────────────────┐
                       │   Orchestrator    │
                       │ (Inngest function)│
                       └─────────┬─────────┘
                                 │
                     ┌───────────┼───────────┐
                     │ A2A       │ A2A       │ A2A
                     ▼           ▼           ▼
                 Research      Coding      Testing
                   Agent        Agent        Agent
                     │           │           │
                     └───────────┼───────────┘
                                 │
                             Reviewer
                                 │
                                 ▼
                               A2UI
                                 │
                                 ▼ (live, via SSE)
                          React Renderer
                       (Trace Timeline, Cost Meter
                            — shadcn/ui)


       Agents                              Agents
          │                                   │
          ▼                                   ▼
        MCP                              libSQL
     ┌────┼─────┐                  (traces + eval results)
     ▼    ▼     ▼
   Files Git   Tests
          │
          ▼
        Docker
       Sandbox
```

---

# 24. Development Milestones

## Milestone 1 — Single Agent

**Target:** Day 1

```text
AI SDK (Gemini / Ollama) → Agent → Streamed Response (via Bun CLI and web)
```

- [x] Gemini connected via Vercel AI SDK
- [x] Ollama fallback connected (`ollama-ai-provider-v2`, verified against a real local server)
- [x] Agent abstraction (`createLlmAgent` in `packages/llm`, implements `@agentmesh/shared`'s `Agent`)
- [x] Bun CLI entrypoint
- [x] Structured + streamed output
- [x] Error handling

## Milestone 2 — Tools

**Target:** Day 3

```text
Agent → MCP → Tools
```

- [ ] File tools
- [ ] Search
- [ ] Git diff
- [ ] Test runner
- [ ] Permissions

## Milestone 3 — Evaluation Harness

**Target:** Day 5

```text
Agent → Golden Tasks → Pass/Fail Report (libSQL)
```

- [ ] Golden task set for Research Agent
- [ ] Eval runner writing to libSQL
- [ ] Regression detection wired into CI

## Milestone 4 — A2A

**Target:** Day 5–6

```text
Agent → A2A → Agent
```

- [ ] Agent Card
- [ ] Discovery
- [ ] Task delegation
- [ ] Result handling

## Milestone 5 — Multi-Agent, Durable + Traced

**Target:** Day 7

```text
Orchestrator (Inngest)
 ├── Research
 ├── Coding
 └── Testing
      ↓
 Trace Timeline (libSQL)
```

- [ ] Orchestration working end-to-end as Inngest steps
- [ ] Basic trace captured per agent run
- [ ] Chaos scenarios tested, including step-retry recovery

## Milestone 6 — A2UI

**Target:** Week 2

```text
Agent → A2UI → shadcn/ui React components (live via SSE)
```

- [ ] Component catalog on shadcn/ui
- [ ] Dynamic cards
- [ ] Diff viewer
- [ ] Approval UI
- [ ] Trace Timeline + Cost Meter rendered live

## Milestone 7 — Production Safety & Proof

**Target:** Week 3

- [ ] Authentication
- [ ] Authorization
- [ ] Sandbox
- [ ] Audit logs
- [ ] Full observability (OpenTelemetry or Langfuse)
- [ ] GitHub PR workflow
- [ ] End-to-end demo completed on a real repository

---

# 25. MVP Definition

MVP tab complete maana jayega jab:

- [ ] User GitHub issue/task submit kar sake (web **ya** Bun CLI se)
- [ ] Orchestrator task plan kare (Inngest durable function ke through, retries working)
- [ ] Research Agent analysis kare
- [ ] Coding Agent patch create kare
- [ ] Testing Agent tests run kare (chaos scenarios included)
- [ ] Reviewer Agent review kare
- [ ] A2UI result dashboard render ho, **live SSE updates** ke saath (trace timeline + cost meter included)
- [ ] Human approval required ho before merge
- [ ] Kam se kam ek agent ke liye eval suite (golden tasks, libSQL) pass ho
- [ ] Ek real repository par end-to-end demo complete ho — sirf toy example nahi
- [ ] Everything local/free-first setup par run ho

---

# 26. What NOT to Build Initially

Avoid:

- ❌ Kubernetes
- ❌ Redis
- ❌ Complex vector database
- ❌ LangChain-heavy abstraction
- ❌ 10+ agents
- ❌ Autonomous production deployment
- ❌ Full SaaS authentication
- ❌ Billing system
- ❌ Full distributed tracing backend (Jaeger/Tempo) — the libSQL trace viewer (Phase 7) is enough until Phase 14
- ❌ Automated prompt A/B testing infra — manually versioned prompt files (`prompts/`) are enough for now
- ❌ Inngest Cloud production deployment — local/dev mode is enough for now
- ❌ Langfuse at production scale — a single self-hosted instance is enough for now

Pehle core protocol architecture prove karo.

---

# 27. Future Extensions

After MVP:

### Agent Marketplace

```text
Agent Registry
     ↓
Discover Agents
     ↓
Install / Trust
     ↓
Delegate Tasks
```

### Agent Reputation

```text
Agent
 ├── Success rate
 ├── Latency
 ├── Security score
 └── User feedback
```

### Agent Memory

```text
Task
 ↓
Short-term memory
 ↓
Long-term project memory
```

### Self-healing CI

```text
CI Failure
    ↓
Testing Agent
    ↓
Coding Agent
    ↓
Fix
    ↓
Tests
    ↓
Retry
```

### Multi-repo Engineering

```text
Frontend Agent
      ↕
Backend Agent
      ↕
Database Agent
      ↕
DevOps Agent
```

---

# 28. Learning Order

Recommended order:

```text
TypeScript Agent (Bun)
      ↓
Function Calling (Vercel AI SDK)
      ↓
Multi-Provider LLMs (Gemini + Ollama via AI SDK)
      ↓
MCP
      ↓
Agent Evaluation (golden tasks, libSQL)
      ↓
A2A
      ↓
Durable Multi-Agent Orchestration (Inngest)
      ↓
Lightweight Observability / Tracing (libSQL → optionally Langfuse)
      ↓
A2UI (shadcn/ui + SSE streaming)
      ↓
Agent Security + Chaos Testing
      ↓
Production Architecture
```

**Don't learn everything simultaneously.**

---

# 29. First Two Weeks

> The original plan had a single "First 7 Days" table aimed at shipping fast. Given the goal here is deep learning _and_ a demonstrable proof — not just speed — this is a more honest two-week breakdown. Individual phase "Time" labels above are approximate; this table is the authoritative schedule.

## Week 1 — Core Loop

| Day | Focus                                                          | Output                                                           |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Bun + Vercel AI SDK (Gemini + Ollama), TS Agent, CLI           | Working agent, streamed, runnable without the web app            |
| 2   | Tool calling                                                   | File/search tools                                                |
| 3   | MCP                                                            | MCP server                                                       |
| 4   | Research Agent + Evaluation Harness (libSQL)                   | Golden tasks + eval runner                                       |
| 5   | A2A basics                                                     | Research Agent wired via A2A                                     |
| 6   | Agent delegation (Inngest) + lightweight trace viewer (libSQL) | Orchestrator + trace UI                                          |
| 7   | Coding + Testing agents (incl. chaos tests)                    | Multi-agent flow, fails gracefully, recovers via Inngest retries |

## Week 2 — Depth & Proof

| Day  | Focus                                  | Output                                    |
| ---- | -------------------------------------- | ----------------------------------------- |
| 8    | Reviewer Agent                         | Independent review step                   |
| 9–10 | A2UI on shadcn/ui + SSE live streaming | Dynamic dashboard, updates without reload |
| 11   | Human-in-the-loop approval             | Approval UI wired to real actions         |
| 12   | Security pass + chaos-test hardening   | Resilient to injected failures            |
| 13   | GitHub integration                     | Real PR opened by an agent                |
| 14   | End-to-end demo on a real repository   | Recorded, demoable MVP                    |

---

# 30. Success Metrics

Track these from the beginning:

```text
Task completion rate
Agent failure rate
Average task latency
Tool-call success rate
Test pass rate
Human approval rate
Token usage
Cost per task
False-positive review rate
```

These now show up **live** in the dashboard via the `CostMeter` and `TraceTimeline` A2UI components (Phase 11), backed by queryable libSQL data — not just console logs.

The goal is not:

> "AI ne kitna code likha?"

The goal is:

> **"AI ne reliably software task kitna complete kiya?"**

---

# 31. Final Target

AgentMesh should eventually feel like:

```text
"You give an engineering task.
The system finds the right agents,
delegates the work,
uses tools safely,
tests the result,
reviews the change,
and presents an actionable UI —
while keeping humans in control of risky actions."
```

And it should be provable on a real repository, not just a toy demo — that's what separates "I built an architecture" from "I built something that works."

That is the core product direction.

---

## Official References

- A2A Protocol: https://a2a-protocol.org/
- A2A Specification: https://a2a-protocol.org/latest/specification/
- MCP: https://modelcontextprotocol.io/
- A2UI: https://a2ui.org/
- Gemini API: https://ai.google.dev/gemini-api/docs
- Ollama: https://ollama.com/
- Bun: https://bun.sh/
- Biome: https://biomejs.dev/
- Turborepo: https://turbo.build/
- Vercel AI SDK: https://sdk.vercel.ai/
- libSQL / Turso: https://turso.tech/
- Inngest: https://www.inngest.com/
- shadcn/ui: https://ui.shadcn.com/
- Langfuse: https://langfuse.com/
- GitHub Actions: https://docs.github.com/actions

---

## Immediate Next Step

Start only with:

```text
Phase 0 (Bun + Turborepo + Biome)
  ↓
Phase 1 (Vercel AI SDK: Gemini + Ollama + CLI)
  ↓
Working Agent, streamed, provable via CLI
```

Once the single agent works, add MCP. Then the evaluation harness. Then A2A. Then durable orchestration (Inngest) and tracing. Then A2UI.

**Architecture first, abstraction later.**
