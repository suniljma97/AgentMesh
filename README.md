# AgentMesh

A multi-agent engineering platform built around A2A, MCP, and A2UI.

## Phase 0

The repository is a Bun workspace with strict TypeScript, Biome, and Turborepo configured. The web app has Tailwind CSS v4 and shadcn/ui initialized. The CLI currently validates task input and will connect to the streamed LLM agent in Phase 1.

## Setup

```bash
bun install
Copy-Item .env.example .env
```

Run the CLI once Bun is installed:

```bash
bun cli run "summarize this file"
```

## Scripts

```bash
bun run typecheck   # tsc --build across all referenced packages
bun run lint         # biome check .
bun run format       # biome format --write .
bun run test         # turbo run test (bun test per package)
bun run build        # turbo run build
```
