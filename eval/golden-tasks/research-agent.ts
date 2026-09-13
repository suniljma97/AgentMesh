import type { GoldenTask } from "./types.js";

/**
 * Golden tasks for the Research Agent (Phase 4 rule: 3-5 per agent).
 * Each expectation is a fact about *this* repository that only holds if the
 * agent actually read the real files via its tools — not something an LLM
 * could get right by guessing from training data alone.
 */
export const researchAgentGoldenTasks: GoldenTask[] = [
  {
    id: "research-001",
    input: "Where is the AgentInput interface defined in this repository?",
    expect: { mustMentionFile: "packages/shared/src/index.ts" },
  },
  {
    id: "research-002",
    input:
      "Where is the resolveWithinRoot path-sandboxing helper function defined?",
    expect: { mustMentionFile: "packages/shared/src/sandbox.ts" },
  },
  {
    id: "research-003",
    input:
      "Which npm package does this project use to talk to a local Ollama server?",
    expect: { mustContainText: "ollama-ai-provider-v2" },
  },
  {
    id: "research-004",
    input: "Where is the ToolPermissionError class defined?",
    expect: { mustMentionFile: "packages/shared/src/permissions.ts" },
  },
  {
    id: "research-005",
    input:
      "What skills does the Research Agent's Agent Card declare? Answer with the exact skill names.",
    expect: { mustContainText: "documentation-search" },
  },
];
