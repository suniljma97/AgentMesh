import { describe, expect, test } from "bun:test";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { stepCountIs, tool } from "ai";
import { z } from "zod";
import { getModel, streamTask } from "./index.js";

function fakeModel(overrides: Partial<LanguageModelV2> = {}): LanguageModelV2 {
  return {
    specificationVersion: "v2",
    provider: "fake",
    modelId: "fake-model",
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error("not used in this test");
    },
    doStream: async () => {
      throw new Error("fake model failure");
    },
    ...overrides,
  } as LanguageModelV2;
}

/** A model that only ever calls a tool, never producing a final text answer. */
function alwaysCallsToolModel(): LanguageModelV2 {
  return fakeModel({
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({
            type: "tool-call",
            toolCallId: "1",
            toolName: "noop",
            input: "{}",
          });
          controller.enqueue({
            type: "finish",
            finishReason: "tool-calls",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          });
          controller.close();
        },
      }),
    }),
  });
}

async function collect(chunks: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const chunk of chunks) out.push(chunk);
  return out;
}

describe("streamTask", () => {
  test("propagates a model error instead of silently yielding nothing", async () => {
    await expect(
      collect(streamTask("test task", { model: fakeModel() })),
    ).rejects.toThrow("fake model failure");
  });

  test("fails loudly when the tool-call step budget runs out without a final answer", async () => {
    const noop = tool({
      inputSchema: z.object({}),
      execute: async () => "ok",
    });

    await expect(
      collect(
        streamTask("test task", {
          model: alwaysCallsToolModel(),
          tools: { noop },
          stopWhen: stepCountIs(2),
        }),
      ),
    ).rejects.toThrow(/ran out of tool-call steps/);
  });
});

describe("getModel", () => {
  test("returns a language model for the configured provider", () => {
    const model = getModel();
    expect(model.specificationVersion).toBe("v2");
    expect(["google.generative-ai", "ollama.responses"]).toContain(
      model.provider,
    );
  });
});
