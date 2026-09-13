import type { Agent, AgentInput, AgentResult } from "@agentmesh/shared";
import { failResult, okResult } from "@agentmesh/shared";
import { type StreamTaskOptions, streamTask } from "./index.js";

export interface LlmAgentOptions extends StreamTaskOptions {
  /** Called with each streamed chunk as it arrives (e.g. to print live output). */
  onChunk?: (chunk: string) => void;
}

/**
 * Wraps streamTask behind the shared Agent interface: takes an AgentInput,
 * drives the same streamed LLM call, and returns a structured AgentResult
 * instead of raw text chunks. Any streamText option (model override, tools,
 * stopWhen, ...) can be passed through — e.g. the Research Agent uses this to
 * give the model real file-access tools instead of just a bare prompt.
 */
export function createLlmAgent(options: LlmAgentOptions = {}): Agent {
  const { onChunk, ...streamOptions } = options;

  return {
    name: "llm-agent",
    description:
      "Streams a task to the configured LLM provider (Gemini or Ollama)",

    async run(input: AgentInput): Promise<AgentResult> {
      let text = "";

      try {
        for await (const chunk of streamTask(input.task, streamOptions)) {
          text += chunk;
          onChunk?.(chunk);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return failResult(message);
      }

      return okResult(text);
    },
  };
}
