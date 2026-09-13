import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { type ZodRawShape, z } from "zod";
import { runTests } from "./tools.js";

// See mcp/filesystem/src/server.ts for why this cast is needed (zod v4 /
// MCP SDK zod-compat version-skew) and what it costs in callback typing.
function shape<S extends ZodRawShape>(schema: S): ZodRawShapeCompat {
  return schema as unknown as ZodRawShapeCompat;
}

export interface TestingServerOptions {
  /** Sandbox root every `cwd` is resolved within. Defaults to process.cwd(). */
  root?: string;
}

export function createTestingServer(
  options: TestingServerOptions = {},
): McpServer {
  const server = new McpServer({ name: "agentmesh-testing", version: "0.1.0" });
  const root = options.root ?? process.cwd();

  server.registerTool(
    "run_tests",
    {
      description:
        "Run `bun test` in a directory under the sandboxed root and report pass/fail with output.",
      inputSchema: shape({
        cwd: z.string().optional(),
        args: z.array(z.string()).optional(),
      }),
    },
    async ({ cwd, args }) => {
      const result = await runTests({ cwd, args }, { root });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.passed,
      };
    },
  );

  return server;
}

if (import.meta.main) {
  const server = createTestingServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
