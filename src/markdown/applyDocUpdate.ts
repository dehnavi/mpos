import { MarkdownDocument } from './DocumentRepository';
import { appendToSection, replaceSection, updateFrontmatterFields } from './SectionEditor';

export interface ApplyDocUpdateOptions {
  /** Top-level (`##`) heading to update. */
  section?: string;
  /** New content for the section (required if `section` is set). */
  text?: string;
  /** Append to the section instead of replacing it. */
  append?: boolean;
  /** New value for the `status` frontmatter field. */
  status?: string;
  /** Allow heading-set or id/type changes (use with care). */
  force?: boolean;
}

/**
 * Applies a section edit and/or status change to a document's raw content,
 * enforcing the AI-safety section-editing invariants in SectionEditor. Throws
 * SectionEditError if the edit is invalid (heading not found, heading set/order
 * would change without `force`, etc.). Always bumps `updated_at`.
 */
export function applyDocUpdate(doc: MarkdownDocument, options: ApplyDocUpdateOptions): string {
  let raw = doc.raw;

  if (options.section) {
    const body = options.text ?? '';
    raw = options.append
      ? appendToSection(raw, options.section, body)
      : replaceSection(raw, options.section, body, { force: options.force });
  }

  const frontmatterUpdates: Record<string, unknown> = {};
  if (options.status) frontmatterUpdates.status = options.status;

  return updateFrontmatterFields(raw, frontmatterUpdates, { force: options.force });
}
