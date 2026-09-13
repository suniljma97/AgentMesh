import { readdir, readFile as readFileFs, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { assertToolAllowed, resolveWithinRoot } from "@agentmesh/shared";

const IGNORED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  ".bun",
  "dist",
]);

const NUL_CHAR = String.fromCharCode(0);

export interface FilesystemToolOptions {
  /** Directory tools are sandboxed to. Defaults to the current working directory. */
  root?: string;
}

function resolveRoot(options: FilesystemToolOptions = {}): string {
  return resolve(options.root ?? process.cwd());
}

async function walk(dir: string, root: string, out: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIR_NAMES.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, root, out);
    } else if (entry.isFile()) {
      out.push(relative(root, fullPath).split(sep).join("/"));
    }
  }
}

export interface ListFilesInput {
  /** Directory to list, relative to the sandboxed root. Defaults to the root itself. */
  path?: string;
}

export async function listFiles(
  input: ListFilesInput = {},
  options?: FilesystemToolOptions,
): Promise<string[]> {
  assertToolAllowed("list_files");

  const root = resolveRoot(options);
  const target = resolveWithinRoot(root, input.path ?? ".");
  const targetStat = await stat(target);

  const results: string[] = [];
  if (targetStat.isDirectory()) {
    await walk(target, root, results);
  } else {
    results.push(relative(root, target).split(sep).join("/"));
  }

  return results.sort();
}

export interface ReadFileInput {
  /** File to read, relative to the sandboxed root. */
  path: string;
}

export async function readFile(
  input: ReadFileInput,
  options?: FilesystemToolOptions,
): Promise<string> {
  assertToolAllowed("read_file");

  const root = resolveRoot(options);
  const target = resolveWithinRoot(root, input.path);
  return readFileFs(target, "utf-8");
}

export interface SearchCodeInput {
  /** Literal substring to search for (case-sensitive). */
  query: string;
  /** Directory to search under, relative to the sandboxed root. Defaults to the root. */
  path?: string;
  /** Stop after this many matches. Defaults to 100. */
  maxResults?: number;
}

export interface SearchCodeMatch {
  file: string;
  line: number;
  text: string;
}

function looksBinary(content: string): boolean {
  // A NUL byte practically never appears in real text; it's the cheapest
  // reliable signal that we decoded something that wasn't UTF-8 text.
  return content.includes(NUL_CHAR);
}

export async function searchCode(
  input: SearchCodeInput,
  options?: FilesystemToolOptions,
): Promise<SearchCodeMatch[]> {
  assertToolAllowed("search_code");

  const root = resolveRoot(options);
  const maxResults = input.maxResults ?? 100;
  const files = await listFiles({ path: input.path }, options);

  const matches: SearchCodeMatch[] = [];

  for (const file of files) {
    if (matches.length >= maxResults) break;

    let content: string;
    try {
      content = await readFileFs(join(root, file), "utf-8");
    } catch {
      continue; // unreadable file (permissions, race with deletion, etc.)
    }
    if (looksBinary(content)) continue;

    const lines = content.split("\n");
    for (let i = 0; i < lines.length && matches.length < maxResults; i++) {
      if (lines[i].includes(input.query)) {
        matches.push({ file, line: i + 1, text: lines[i].trim() });
      }
    }
  }

  return matches;
}
