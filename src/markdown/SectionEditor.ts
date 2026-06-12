import {
  appendToSection as appendToSectionRaw,
  upsertSection,
  updateFrontmatter,
} from '../utils/markdownUtils';
import { getTopLevelHeadings, findSection } from './SectionLocator';
import { DocumentFrontmatter } from '../domain/types';

/** Thrown when an edit would violate an AI-safety invariant without `--force`. */
export class SectionEditError extends Error {}

/**
 * Replace the body of a top-level (`##`) section. Per ai-safety-rules.md §3/§4,
 * this refuses to create a new section or change the document's heading set/order
 * unless `force` is set.
 */
export function replaceSection(
  raw: string,
  heading: string,
  newBody: string,
  opts: { force?: boolean } = {}
): string {
  const force = opts.force ?? false;

  const section = findSection(raw, heading, 2);
  if (!section && !force) {
    throw new SectionEditError(
      `Section "${heading}" not found. Use --force to add a new top-level section ` +
        '(not recommended — see .mpos/rules/ai-safety-rules.md).'
    );
  }

  const before = getTopLevelHeadings(raw);
  const updated = upsertSection(raw, heading, newBody, 2);
  const after = getTopLevelHeadings(updated);

  if (!force && JSON.stringify(before) !== JSON.stringify(after)) {
    throw new SectionEditError(
      `Editing section "${heading}" would change the document's top-level heading set ` +
        `(${before.join(', ')} -> ${after.join(', ')}). This is not allowed without ` +
        '--force (see .mpos/rules/ai-safety-rules.md §3/§4).'
    );
  }

  return updated;
}

/** Append content to the end of a top-level section. Never changes the heading set. */
export function appendToSection(raw: string, heading: string, additionalContent: string): string {
  return appendToSectionRaw(raw, heading, additionalContent);
}

/**
 * Update frontmatter fields and bump `updated_at`. Rejects changes to `id`/`type`
 * unless `force` is set (ai-safety-rules.md §3).
 */
export function updateFrontmatterFields(
  raw: string,
  updates: Partial<DocumentFrontmatter>,
  opts: { force?: boolean } = {}
): string {
  const force = opts.force ?? false;
  if (!force && ('id' in updates || 'type' in updates)) {
    throw new SectionEditError('Changing "id" or "type" requires --force.');
  }
  return updateFrontmatter(raw, updates);
}
