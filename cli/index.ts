import { createLlmAgent } from "@agentmesh/llm";

export function parseTask(args: string[]): string | undefined {
  const [command, ...rest] = args;

  if (command !== "run" || rest.length === 0) {
    return undefined;
  }

  return rest.join(" ");
}

if (import.meta.main) {
  const task = parseTask(process.argv.slice(2));

  if (!task) {
    console.error('Usage: bun cli run "<task>"');
    process.exit(1);
  }

  const agent = createLlmAgent({
    onChunk: (chunk) => process.stdout.write(chunk),
  });

  const result = await agent.run({ task });
  process.stdout.write("\n");

  if (result.status === "failed") {
    console.error("AgentMesh task failed:", result.message);
    process.exitCode = 1;
  }
}
