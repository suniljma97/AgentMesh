import { listFiles, readFile, searchCode } from "@agentmesh/mcp-filesystem";
import { type ToolSet, tool } from "ai";
import { z } from "zod";

export interface ResearchToolsOptions {
  /** Repository directory the tools are sandboxed to (see resolveWithinRoot). */
  root: string;
}

/**
 * Gives the model real, sandboxed access to the target repository — reusing
 * the exact Phase 2 MCP tool functions (not re-implemented here) so a
 * traversal-safe, execFile-only path is the only way in. Without this, a
 * "research agent" is just an LLM guessing about a repo it never actually
 * reads.
 */
export function createResearchTools({ root }: ResearchToolsOptions): ToolSet {
  return {
    list_files: tool({
      description:
        "List files under a directory in the repository, relative to its root. Omit path to list the whole repository.",
      inputSchema: z.object({
        path: z.string().optional(),
      }),
      execute: async ({ path }) => listFiles({ path }, { root }),
    }),

    read_file: tool({
      description:
        "Read a file's contents from the repository, relative to its root.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path }) => readFile({ path }, { root }),
    }),

    search_code: tool({
      description:
        "Search file contents in the repository for a literal (case-sensitive) substring.",
      inputSchema: z.object({
        query: z.string(),
        path: z.string().optional(),
        maxResults: z.number().optional(),
      }),
      execute: async ({ query, path, maxResults }) =>
        searchCode({ query, path, maxResults }, { root }),
    }),
  };
}
