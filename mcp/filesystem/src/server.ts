import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { type ZodRawShape, z } from "zod";
import { listFiles, readFile, searchCode } from "./tools.js";

// The SDK's zod-compat layer types against `zod/v4/core`'s internal `$ZodType`,
// which doesn't structurally line up with this project's classic top-level
// `zod` import even at a matching zod version (a known zod v4 / MCP SDK
// version-skew issue). The schemas are valid at runtime (registerTool duck-types
// them via safeParse) — this cast only silences the mismatched structural check.
//
// Side effect: because the cast erases the shape's literal keys, each tool
// callback below receives its arguments as an implicit contextual type rather
// than a checked one. The *runtime* shape is still exactly what the zod schema
// declares (safeParse populates it for real) — only the compile-time callback
// signature loses precision. Keep each callback's destructured names in sync
// with its schema by hand.
function shape<S extends ZodRawShape>(schema: S): ZodRawShapeCompat {
  return schema as unknown as ZodRawShapeCompat;
}

export interface FilesystemServerOptions {
  /** Sandbox root every `path` is resolved within. Defaults to process.cwd(). */
  root?: string;
}

export function createFilesystemServer(
  options: FilesystemServerOptions = {},
): McpServer {
  const server = new McpServer({
    name: "agentmesh-filesystem",
    version: "0.1.0",
  });
  const root = options.root ?? process.cwd();

  server.registerTool(
    "list_files",
    {
      description:
        "List files under a directory, relative to the sandboxed project root.",
      inputSchema: shape({ path: z.string().optional() }),
    },
    async ({ path }) => {
      const files = await listFiles({ path }, { root });
      return {
        content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
      };
    },
  );

  server.registerTool(
    "read_file",
    {
      description:
        "Read a file's contents, relative to the sandboxed project root.",
      inputSchema: shape({ path: z.string() }),
    },
    async ({ path }) => {
      const content = await readFile({ path }, { root });
      return { content: [{ type: "text", text: content }] };
    },
  );

  server.registerTool(
    "search_code",
    {
      description:
        "Search file contents under the project root for a literal substring.",
      inputSchema: shape({
        query: z.string(),
        path: z.string().optional(),
        maxResults: z.number().optional(),
      }),
    },
    async ({ query, path, maxResults }) => {
      const matches = await searchCode({ query, path, maxResults }, { root });
      return {
        content: [{ type: "text", text: JSON.stringify(matches, null, 2) }],
      };
    },
  );

  return server;
}

if (import.meta.main) {
  const server = createFilesystemServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
