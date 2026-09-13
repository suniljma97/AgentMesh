import { z } from "zod";

export const environmentSchema = z.object({
  LLM_PROVIDER: z.enum(["gemini", "ollama"]).default("ollama"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  // Google periodically retires model names (gemini-2.0-flash was retired
  // mid-project in favor of gemini-3.6-flash) — keep this configurable so a
  // retirement is a .env edit, not a code change.
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434/api"),
  OLLAMA_MODEL: z.string().min(1).default("qwen2.5:7b"),
});

export const env = environmentSchema.parse(process.env);
