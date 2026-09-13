import { describe, expect, test } from "bun:test";
import { streamTask } from "./index.js";

describe("streamTask", () => {
  test("ollama provider throws until Phase 1 implements it", async () => {
    const collect = async () => {
      const chunks: string[] = [];
      for await (const chunk of streamTask("test task")) {
        chunks.push(chunk);
      }
      return chunks;
    };

    await expect(collect()).rejects.toThrow(
      "Ollama provider is not yet implemented in Phase 1",
    );
  });
});
