import { describe, expect, test } from "bun:test";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createLlmAgent } from "./agent.js";

function fakeModel(chunks: string[]): LanguageModelV2 {
  return {
    specificationVersion: "v2",
    provider: "fake",
    modelId: "fake-model",
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error("not used in this test");
    },
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          for (const text of chunks) {
            controller.enqueue({ type: "text-delta", id: "1", delta: text });
          }
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          });
          controller.close();
        },
      }),
    }),
  } as LanguageModelV2;
}

function failingModel(message: string): LanguageModelV2 {
  return {
    specificationVersion: "v2",
    provider: "fake",
    modelId: "fake-model",
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error("not used in this test");
    },
    doStream: async () => {
      throw new Error(message);
    },
  } as LanguageModelV2;
}

describe("createLlmAgent", () => {
  test("exposes name and description", () => {
    const agent = createLlmAgent();
    expect(agent.name).toBe("llm-agent");
    expect(agent.description.length).toBeGreaterThan(0);
  });

  test("streams chunks via onChunk and returns the full text on success", async () => {
    const seen: string[] = [];
    const agent = createLlmAgent({
      model: fakeModel(["Hello, ", "world!"]),
      onChunk: (chunk) => seen.push(chunk),
    });

    const result = await agent.run({ task: "test task" });

    expect(seen).toEqual(["Hello, ", "world!"]);
    expect(result).toEqual({
      status: "completed",
      message: "Hello, world!",
      data: undefined,
    });
  });

  test("returns a failed AgentResult when the model errors, instead of throwing", async () => {
    const agent = createLlmAgent({ model: failingModel("boom") });
    const result = await agent.run({ task: "test task" });

    expect(result.status).toBe("failed");
    expect(result.message).toBe("boom");
  });
});
