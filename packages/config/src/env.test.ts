import { describe, expect, test } from "bun:test";
import { environmentSchema } from "./env.js";

describe("environmentSchema", () => {
  test("applies defaults when nothing is set", () => {
    const parsed = environmentSchema.parse({});
    expect(parsed.LLM_PROVIDER).toBe("ollama");
    expect(parsed.OLLAMA_BASE_URL).toBe("http://localhost:11434/api");
    expect(parsed.OLLAMA_MODEL).toBe("qwen2.5:7b");
  });

  test("rejects an unknown LLM_PROVIDER", () => {
    expect(() => environmentSchema.parse({ LLM_PROVIDER: "openai" })).toThrow();
  });

  test("accepts gemini with an api key", () => {
    const parsed = environmentSchema.parse({
      LLM_PROVIDER: "gemini",
      GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
    });
    expect(parsed.LLM_PROVIDER).toBe("gemini");
    expect(parsed.GOOGLE_GENERATIVE_AI_API_KEY).toBe("test-key");
  });

  test("rejects an invalid OLLAMA_BASE_URL", () => {
    expect(() =>
      environmentSchema.parse({ OLLAMA_BASE_URL: "not-a-url" }),
    ).toThrow();
  });
});
