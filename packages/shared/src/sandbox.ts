import { relative, resolve, sep } from "node:path";

/**
 * Resolves `target` (default: the root itself) against `root` and rejects any
 * path that would resolve outside it — e.g. "../../etc/passwd", or an absolute
 * path on a different drive. Every tool that touches the filesystem, or spawns
 * a process in a caller-influenced directory, must go through this: the sandbox
 * boundary (`root`) is always set by the server/tool operator, never by the
 * remote caller, or it isn't a sandbox at all.
 */
export function resolveWithinRoot(root: string, target?: string): string {
  const resolvedRoot = resolve(root);
  const resolved = resolve(resolvedRoot, target ?? ".");
  const rel = relative(resolvedRoot, resolved);

  if (rel === ".." || rel.startsWith(`..${sep}`) || resolve(rel) === rel) {
    throw new Error(
      `Path "${target ?? "."}" escapes the sandboxed root "${resolvedRoot}"`,
    );
  }

  return resolved;
}
