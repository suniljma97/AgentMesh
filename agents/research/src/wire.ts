import { createLlmAgent } from "@agentmesh/llm";
import type { Agent } from "@agentmesh/shared";
import { stepCountIs } from "ai";
import { createResearchAgent, type ResearchAgentCard } from "./index.js";
import { createResearchTools } from "./tools.js";

export interface DefaultResearchAgentOptions {
  /** Repository the agent is allowed to read. */
  root: string;
  /** Called with each streamed chunk as the delegate LLM responds. */
  onChunk?: (chunk: string) => void;
  /** Max tool-call + response steps before forcing a final answer. Default 6. */
  maxSteps?: number;
}

/**
 * The real, end-to-end Research Agent: an LLM delegate wired to the actual
 * Phase 2 file-access tools (createResearchAgent alone is just the prompt
 * wrapper — it has no tool access unless the delegate it's given has one).
 */
export function createDefaultResearchAgent(
  options: DefaultResearchAgentOptions,
): Agent & { card: ResearchAgentCard } {
  const delegate = createLlmAgent({
    tools: createResearchTools({ root: options.root }),
    stopWhen: stepCountIs(options.maxSteps ?? 6),
    onChunk: options.onChunk,
  });

  return createResearchAgent({ delegate });
}
