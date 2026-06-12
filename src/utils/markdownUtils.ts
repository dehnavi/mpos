import matter from 'gray-matter';
import { DocumentFrontmatter, MarkdownSection } from '../domain/types';
import { format } from 'date-fns';

/** Section marker names, per `.mpos/rules/markdown-rules.md` §3. */
export const MARKER_NAMES = [
  'BUSINESS_RULE',
  'OPEN_QUESTION',
  'CONFLICT',
  'DECISION',
  'ASSUMPTION',
  'RISK',
  'TODO',
] as const;

export type MarkerName = (typeof MARKER_NAMES)[number];

/**
 * Matches a marker line of the form:
 * `- **[MARKER]** (optional-id) text`
 */
const MARKER_LINE_RE =
  /^\s*-\s+\*\*\[(BUSINESS_RULE|OPEN_QUESTION|CONFLICT|DECISION|ASSUMPTION|RISK|TODO)\]\*\*(?:\s+\(([A-Za-z0-9_-]+)\))?\s+(.*)$/;

export interface MarkerMatch {
  marker: MarkerName;
  localId?: string;
  text: string;
}

export interface ParsedMarkdown {
  frontmatter: Partial<DocumentFrontmatter>;
  content: string;
  sections: MarkdownSection[];
  markers: Record<string, MarkerMatch[]>;
}

export function parseMarkdown(raw: string): ParsedMarkdown {
  const { data, content } = matter(raw);
  // Normalize Date objects to ISO date strings (js-yaml parses YYYY-MM-DD as Date)
  for (const key of Object.keys(data)) {
    if (data[key] instanceof Date) {
      data[key] = (data[key] as Date).toISOString().split('T')[0];
    }
  }
  const sections = parseSections(content);
  const markers = extractMarkers(content);
  return {
    frontmatter: data as Partial<DocumentFrontmatter>,
    content,
    sections,
    markers,
  };
}

export function stringifyMarkdown(frontmatter: Partial<DocumentFrontmatter>, content: string): string {
  return matter.stringify(content, frontmatter);
}

export function parseSections(content: string): MarkdownSection[] {
  const lines = content.split('\n');
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;
  const contentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      if (current) {
        current.content = contentLines.join('\n').trim();
        current.markers = extractMarkersFromText(current.content);
        sections.push(current);
        contentLines.length = 0;
      }
      current = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        content: '',
        markers: [],
      };
    } else if (current) {
      contentLines.push(line);
    }
  }

  if (current) {
    current.content = contentLines.join('\n').trim();
    current.markers = extractMarkersFromText(current.content);
    sections.push(current);
  }

  return sections;
}

export function getSectionContent(content: string, sectionHeading: string): string | null {
  const sections = parseSections(content);
  const section = sections.find(
    (s) => s.heading.toLowerCase() === sectionHeading.toLowerCase()
  );
  return section?.content ?? null;
}

export function upsertSection(
  content: string,
  heading: string,
  newContent: string,
  level = 2
): string {
  const headingLine = `${'#'.repeat(level)} ${heading}`;
  const headingRegex = new RegExp(`^#{1,6}\\s+${escapeRegex(heading)}\\s*$`, 'mi');

  if (headingRegex.test(content)) {
    // Replace the existing section content
    const lines = content.split('\n');
    const result: string[] = [];
    let inSection = false;
    let foundSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeading = /^#{1,6}\s+/.test(line);
      const isTargetHeading = headingRegex.test(line);

      if (isTargetHeading) {
        result.push(line);
        result.push('');
        result.push(newContent);
        result.push('');
        inSection = true;
        foundSection = true;
        continue;
      }

      if (inSection && isHeading) {
        inSection = false;
      }

      if (!inSection || !foundSection) {
        result.push(line);
      }
    }

    return result.join('\n');
  } else {
    // Append new section
    const trimmed = content.trimEnd();
    return `${trimmed}\n\n${headingLine}\n\n${newContent}\n`;
  }
}

export function appendToSection(
  content: string,
  sectionHeading: string,
  newContent: string
): string {
  const headingRegex = new RegExp(`^#{1,6}\\s+${escapeRegex(sectionHeading)}\\s*$`, 'mi');

  if (!headingRegex.test(content)) {
    return `${content.trimEnd()}\n\n## ${sectionHeading}\n\n${newContent}\n`;
  }

  const lines = content.split('\n');
  const result: string[] = [];
  let inSection = false;
  let sectionEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = /^#{1,6}\s+/.test(line);
    const isTargetHeading = headingRegex.test(line);

    if (isTargetHeading) {
      inSection = true;
    } else if (inSection && isHeading) {
      sectionEndIndex = i;
      inSection = false;
    }
    result.push(line);
  }

  const insertAt = sectionEndIndex === -1 ? result.length : sectionEndIndex;
  result.splice(insertAt, 0, '', newContent, '');
  return result.join('\n');
}

export function extractMarkers(content: string): Record<string, MarkerMatch[]> {
  const result: Record<string, MarkerMatch[]> = {};
  for (const line of content.split('\n')) {
    const m = line.match(MARKER_LINE_RE);
    if (!m) continue;
    const marker = m[1] as MarkerName;
    const entry: MarkerMatch = { marker, text: m[3].trim() };
    if (m[2]) entry.localId = m[2];
    (result[marker] ??= []).push(entry);
  }
  return result;
}

export function extractMarkersFromText(text: string): string[] {
  const found = new Set<string>();
  for (const line of text.split('\n')) {
    const m = line.match(MARKER_LINE_RE);
    if (m) found.add(m[1]);
  }
  return [...found];
}

export function updateFrontmatter(
  raw: string,
  updates: Partial<DocumentFrontmatter>
): string {
  const { data, content } = matter(raw);
  const merged = { ...data, ...updates, updated_at: todayString() };
  // Convert any Date objects back to ISO date strings (js-yaml auto-parses YYYY-MM-DD as Date)
  for (const key of Object.keys(merged)) {
    if ((merged as Record<string, unknown>)[key] instanceof Date) {
      (merged as Record<string, unknown>)[key] = ((merged as Record<string, unknown>)[key] as Date)
        .toISOString()
        .split('T')[0];
    }
  }
  return matter.stringify(content, merged);
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function nowString(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function markdownList(items: string[], ordered = false): string {
  return items
    .map((item, idx) => (ordered ? `${idx + 1}. ${item}` : `- ${item}`))
    .join('\n');
}

export function markdownTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return [header, separator, body].join('\n');
}
