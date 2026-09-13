import { streamTask } from "@agentmesh/llm";

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

  try {
    for await (const chunk of streamTask(task)) {
      process.stdout.write(chunk);
    }
    process.stdout.write("\n");
  } catch (error) {
    console.error("AgentMesh task failed:", error);
    process.exitCode = 1;
  }
}
