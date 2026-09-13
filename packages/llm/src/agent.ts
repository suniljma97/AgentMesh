import type { Agent, AgentInput, AgentResult } from "@agentmesh/shared";
import { failResult, okResult } from "@agentmesh/shared";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { streamTask } from "./index.js";

export interface LlmAgentOptions {
  /** Called with each streamed chunk as it arrives (e.g. to print live output). */
  onChunk?: (chunk: string) => void;
  /** Override the model (defaults to the env-configured provider). Mainly for tests. */
  model?: LanguageModelV2;
}

/**
 * Wraps streamTask behind the shared Agent interface: takes an AgentInput,
 * drives the same streamed LLM call, and returns a structured AgentResult
 * instead of raw text chunks.
 */
export function createLlmAgent(options: LlmAgentOptions = {}): Agent {
  return {
    name: "llm-agent",
    description:
      "Streams a task to the configured LLM provider (Gemini or Ollama)",

    async run(input: AgentInput): Promise<AgentResult> {
      let text = "";

      try {
        const chunks = options.model
          ? streamTask(input.task, options.model)
          : streamTask(input.task);

        for await (const chunk of chunks) {
          text += chunk;
          options.onChunk?.(chunk);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return failResult(message);
      }

      return okResult(text);
    },
  };
}
