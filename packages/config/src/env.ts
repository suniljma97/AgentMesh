import { z } from "zod";

export const environmentSchema = z.object({
  LLM_PROVIDER: z.enum(["gemini", "ollama"]).default("ollama"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434/api"),
  OLLAMA_MODEL: z.string().min(1).default("qwen2.5:7b"),
});

export const env = environmentSchema.parse(process.env);
