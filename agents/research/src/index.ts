import type { Agent, AgentInput, AgentResult } from "@agentmesh/shared";

export { createResearchTools, type ResearchToolsOptions } from "./tools.js";
export {
  createDefaultResearchAgent,
  type DefaultResearchAgentOptions,
} from "./wire.js";

export interface ResearchAgentCard {
  name: string;
  description: string;
  skills: readonly ["code-analysis", "documentation-search"];
}

export const researchAgentCard: ResearchAgentCard = {
  name: "Research Agent",
  description: "Analyzes technical issues and repositories",
  skills: ["code-analysis", "documentation-search"],
};

export interface ResearchAgentOptions {
  delegate: Agent;
}

export function createResearchAgent({
  delegate,
}: ResearchAgentOptions): Agent & {
  card: ResearchAgentCard;
} {
  return {
    name: "research-agent",
    description: researchAgentCard.description,
    card: researchAgentCard,
    run(input: AgentInput): Promise<AgentResult> {
      const researchTask = [
        "Act as a research agent.",
        "Analyze the repository or technical issue described below.",
        "If file-access tools (list_files, read_file, search_code) are available, use them",
        "to ground your answer in the actual repository — do not guess at file contents or",
        "structure you have not looked at.",
        "Identify relevant files, symbols, likely causes, and useful documentation.",
        "Return concise, evidence-based findings, citing the specific files you read.",
        "",
        `Task: ${input.task}`,
      ].join("\n");

      return delegate.run({ task: researchTask });
    },
  };
}
