export interface AgentInput {
  task: string;
}

export interface AgentResult {
  status: "completed" | "failed";
  message: string;
  data?: unknown;
}

export interface Agent {
  name: string;
  description: string;
  run(input: AgentInput): Promise<AgentResult>;
}

export function okResult(message: string, data?: unknown): AgentResult {
  return { status: "completed", message, data };
}

export function failResult(message: string, data?: unknown): AgentResult {
  return { status: "failed", message, data };
}

export * from "./permissions.js";
export * from "./sandbox.js";
