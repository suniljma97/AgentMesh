import { describe, expect, test } from "bun:test";
import type { LanguageModelV2 } from "@ai-sdk/provider";
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

describe("streamTask", () => {
  test("propagates a model error instead of silently yielding nothing", async () => {
    const collect = async () => {
      const chunks: string[] = [];
      for await (const chunk of streamTask("test task", fakeModel())) {
        chunks.push(chunk);
      }
      return chunks;
    };

    await expect(collect()).rejects.toThrow("fake model failure");
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
