import * as path from 'path';

/**
 * Package root — two levels above this file in both `src/utils/paths.ts` (ts-node)
 * and `dist/utils/paths.js` (compiled), since `src/` and `dist/` both sit directly
 * under the project root.
 */
const PACKAGE_ROOT = path.join(__dirname, '..', '..');

/** Resolve a path under the bundled `resources/` directory. */
export function resolveResourcePath(...segments: string[]): string {
  return path.join(PACKAGE_ROOT, 'resources', ...segments);
}

export function getPackageRoot(): string {
  return PACKAGE_ROOT;
}
