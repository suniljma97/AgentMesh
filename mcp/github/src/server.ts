import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { type ZodRawShape, z } from "zod";
import { gitDiff } from "./tools.js";

// See mcp/filesystem/src/server.ts for why this cast is needed (zod v4 /
// MCP SDK zod-compat version-skew) and what it costs in callback typing.
function shape<S extends ZodRawShape>(schema: S): ZodRawShapeCompat {
  return schema as unknown as ZodRawShapeCompat;
}

export interface GithubServerOptions {
  /** Sandbox root every `cwd` is resolved within. Defaults to process.cwd(). */
  root?: string;
}

export function createGithubServer(
  options: GithubServerOptions = {},
): McpServer {
  const server = new McpServer({ name: "agentmesh-github", version: "0.1.0" });
  const root = options.root ?? process.cwd();

  server.registerTool(
    "git_diff",
    {
      description:
        "Show the working-tree diff for a local git repository under the sandboxed root.",
      inputSchema: shape({
        cwd: z.string().optional(),
        args: z.array(z.string()).optional(),
      }),
    },
    async ({ cwd, args }) => {
      const diff = await gitDiff({ cwd, args }, { root });
      return { content: [{ type: "text", text: diff || "(no changes)" }] };
    },
  );

  return server;
}

if (import.meta.main) {
  const server = createGithubServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
