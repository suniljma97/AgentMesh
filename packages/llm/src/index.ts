import { env } from "@agentmesh/config";
import { google } from "@ai-sdk/google";
import { type LanguageModel, streamText } from "ai";

const ollama = {
  baseURL: env.OLLAMA_BASE_URL,
  model: env.OLLAMA_MODEL,
};

function getModel(): LanguageModel {
  if (env.LLM_PROVIDER === "gemini") {
    return google("gemini-2.0-flash");
  }

  return {
    specificationVersion: "v2",
    provider: "ollama",
    modelId: ollama.model,
    supportedUrls: {},
    defaultObjectGenerationMode: "json",
    doGenerate: async () => {
      throw new Error("Ollama provider is not yet implemented in Phase 1");
    },
    doStream: async () => {
      throw new Error("Ollama provider is not yet implemented in Phase 1");
    },
  } as LanguageModel;
}

export async function* streamTask(task: string): AsyncGenerator<string> {
  const model = getModel();
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
