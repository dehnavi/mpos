import * as path from 'path';

export class UnsafePathError extends Error {}

/**
 * Resolves a workspace-relative path from an HTTP request, rejecting anything that
 * escapes `root` or doesn't point at a Markdown file. Prevents path traversal via the
 * `path` query/body parameter on the IDE's local API.
 */
export function resolveSafeRelPath(root: string, relPath: string): string {
  if (!relPath || typeof relPath !== 'string') {
    throw new UnsafePathError('Missing "path" parameter');
  }

  const normalized = relPath.replace(/\\/g, '/');
  const resolved = path.resolve(root, normalized);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;

  if (!resolved.startsWith(rootWithSep)) {
    throw new UnsafePathError(`Path "${relPath}" is outside the workspace`);
  }
  if (!resolved.toLowerCase().endsWith('.md')) {
    throw new UnsafePathError(`Path "${relPath}" is not a Markdown file`);
  }

  return normalized;
}
