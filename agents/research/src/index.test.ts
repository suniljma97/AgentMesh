import { describe, expect, test } from "bun:test";
import type { Agent, AgentInput } from "@agentmesh/shared";
import { createResearchAgent, researchAgentCard } from "./index.js";

function recordingAgent(
  resultMessage = "Research complete",
): Agent & { calls: AgentInput[] } {
  const calls: AgentInput[] = [];

  return {
    name: "test-agent",
    description: "A test delegate",
    calls,
    async run(input) {
      calls.push(input);
      return { status: "completed", message: resultMessage };
    },
  };
}

describe("createResearchAgent", () => {
  test("exposes discoverable research capabilities", () => {
    const agent = createResearchAgent({ delegate: recordingAgent() });

    expect(agent.name).toBe("research-agent");
    expect(agent.description).toBe(
      "Analyzes technical issues and repositories",
    );
    expect(agent.card).toEqual(researchAgentCard);
    expect(agent.card.skills).toEqual([
      "code-analysis",
      "documentation-search",
    ]);
  });

  test("delegates a research-focused task and returns its result", async () => {
    const delegate = recordingAgent("Found auth.ts token validation");
    const agent = createResearchAgent({ delegate });

    const result = await agent.run({
      task: "Find where login tokens are validated",
    });

    expect(delegate.calls).toHaveLength(1);
    expect(delegate.calls[0]?.task).toContain(
      "Find where login tokens are validated",
    );
    expect(delegate.calls[0]?.task).toContain("Identify relevant files");
    expect(result).toEqual({
      status: "completed",
      message: "Found auth.ts token validation",
    });
  });
});
