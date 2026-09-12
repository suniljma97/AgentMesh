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

  console.log(`AgentMesh task received: ${task}`);
  console.log("Phase 1 agent execution will be connected next.");
}
