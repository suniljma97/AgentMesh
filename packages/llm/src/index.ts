import { env } from "@agentmesh/config";
import { google } from "@ai-sdk/google";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { type StopCondition, streamText, type ToolSet } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

export function getModel(): LanguageModelV2 {
  if (env.LLM_PROVIDER === "gemini") {
    return google(env.GEMINI_MODEL);
  }

  const ollama = createOllama({ baseURL: env.OLLAMA_BASE_URL });
  return ollama(env.OLLAMA_MODEL);
}

// streamText's own settings type is a discriminated union over prompt vs.
// messages, which doesn't Omit/spread cleanly — so this lists just the fields
// streamTask actually threads through, rather than fighting that union.
export interface StreamTaskOptions {
  /** Override the model (defaults to the env-configured provider). */
  model?: LanguageModelV2;
  /** Optional system prompt, prepended ahead of `task`. */
  system?: string;
  /** Tools the model may call (e.g. real file-access tools for a research agent). */
  tools?: ToolSet;
  /** When to stop calling tools and return a final answer. Required alongside
   * `tools` for anything beyond a single tool call — streamText's own default
   * (`stepCountIs(1)`) stops after one step, before the model can see a tool's
   * result and respond to it. */
  stopWhen?: StopCondition<ToolSet> | StopCondition<ToolSet>[];
}

export async function* streamTask(
  task: string,
  options: StreamTaskOptions = {},
): AsyncGenerator<string> {
  const { model = getModel(), system, tools, stopWhen } = options;
  let streamError: unknown;

  // streamText's default onError only logs and swallows the error — .textStream
  // silently ends with zero chunks on failure unless we capture and rethrow it.
  const result = streamText({
    model,
    prompt: task,
    system,
    tools,
    stopWhen,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }

  if (streamError) {
    throw streamError;
  }

  // finishReason reflects the *last* step. With tools + stopWhen, "tool-calls"
  // there specifically means the step budget ran out while the model still
  // wanted to call another tool — it never reached a natural "stop" with a
  // final answer. Left unchecked, that silently surfaces as an empty (or
  // truncated) *success* instead of the failure it actually is.
  const finishReason = await result.finishReason;
  if (finishReason === "tool-calls") {
    throw new Error(
      "Model ran out of tool-call steps (stopWhen) without producing a final answer — " +
        "raise the step budget, or check whether a tool keeps failing.",
    );
  }
}

export { createLlmAgent } from "./agent.js";
