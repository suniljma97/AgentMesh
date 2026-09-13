import { env } from "@agentmesh/config";
import { google } from "@ai-sdk/google";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { streamText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

export function getModel(): LanguageModelV2 {
  if (env.LLM_PROVIDER === "gemini") {
    return google("gemini-2.0-flash");
  }

  const ollama = createOllama({ baseURL: env.OLLAMA_BASE_URL });
  return ollama(env.OLLAMA_MODEL);
}

export async function* streamTask(
  task: string,
  model: LanguageModelV2 = getModel(),
): AsyncGenerator<string> {
  let streamError: unknown;

  // streamText's default onError only logs and swallows the error — .textStream
  // silently ends with zero chunks on failure unless we capture and rethrow it.
  const result = streamText({
    model,
    prompt: task,
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
}

export { createLlmAgent } from "./agent.js";
