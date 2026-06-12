import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  stringifyMarkdown,
  parseSections,
  getSectionContent,
  upsertSection,
  appendToSection,
  extractMarkers,
  extractMarkersFromText,
  markdownList,
  markdownTable,
  todayString,
  nowString,
} from './markdownUtils';

const RAW = `---
id: STORY-001
title: Test Story
type: story
status: backlog
---

# Test Story

## Summary

Original summary.

## Description

Line 1.

### Sub-detail

Nested content.

## Open Questions

- **[OPEN_QUESTION]** (OQ-1) Should free-tier orgs be limited to 1 workspace?
- Not a marker line.
`;

describe('parseMarkdown / stringifyMarkdown', () => {
  it('parses frontmatter and body content', () => {
    const { frontmatter, content } = parseMarkdown(RAW);

    expect(frontmatter.id).toBe('STORY-001');
    expect(frontmatter.type).toBe('story');
    expect(content).toContain('## Summary');
  });

  it('round-trips frontmatter and content through stringifyMarkdown', () => {
    const { frontmatter, content } = parseMarkdown(RAW);
    const restringified = stringifyMarkdown(frontmatter, content);
    const reparsed = parseMarkdown(restringified);

    expect(reparsed.frontmatter.id).toBe(frontmatter.id);
    expect(reparsed.content.trim()).toBe(content.trim());
  });
});

describe('parseSections', () => {
  it("assigns each heading's content as the text up to the next heading of any level", () => {
    const { content } = parseMarkdown(RAW);
    const sections = parseSections(content);

    const description = sections.find((s) => s.heading === 'Description')!;
    // Description's content stops at the next heading (### Sub-detail),
    // even though Sub-detail is a deeper level.
    expect(description.content).toBe('Line 1.');

    const subDetail = sections.find((s) => s.heading === 'Sub-detail')!;
    expect(subDetail.content).toBe('Nested content.');
  });

  it('records the level of each heading', () => {
    const { content } = parseMarkdown(RAW);
    const sections = parseSections(content);

    expect(sections.find((s) => s.heading === 'Summary')!.level).toBe(2);
    expect(sections.find((s) => s.heading === 'Sub-detail')!.level).toBe(3);
  });
});

describe('getSectionContent', () => {
  it('returns the content of a section by heading, case-insensitively', () => {
    const { content } = parseMarkdown(RAW);
    expect(getSectionContent(content, 'summary')).toBe('Original summary.');
  });

  it('returns null for a heading that does not exist', () => {
    const { content } = parseMarkdown(RAW);
    expect(getSectionContent(content, 'Nonexistent')).toBeNull();
  });
});

describe('upsertSection', () => {
  it('replaces the content of an existing section', () => {
    const { content } = parseMarkdown(RAW);
    const updated = upsertSection(content, 'Summary', 'New summary.');

    expect(updated).toContain('New summary.');
    expect(updated).not.toContain('Original summary.');
    expect(updated).toContain('## Description');
  });

  it('appends a new top-level section when the heading does not exist', () => {
    const { content } = parseMarkdown(RAW);
    const updated = upsertSection(content, 'Notes', 'A new note.');

    expect(updated).toContain('## Notes');
    expect(updated).toContain('A new note.');
  });
});

describe('appendToSection', () => {
  it('appends content after the existing content of a section', () => {
    const { content } = parseMarkdown(RAW);
    const updated = appendToSection(content, 'Summary', 'Extra detail.');

    const summaryIdx = updated.indexOf('Original summary.');
    const extraIdx = updated.indexOf('Extra detail.');
    expect(summaryIdx).toBeGreaterThanOrEqual(0);
    expect(extraIdx).toBeGreaterThan(summaryIdx);
  });

  it('creates a new section when the heading does not exist', () => {
    const { content } = parseMarkdown(RAW);
    const updated = appendToSection(content, 'Notes', 'A new note.');

    expect(updated).toContain('## Notes');
    expect(updated).toContain('A new note.');
  });
});

describe('extractMarkers / extractMarkersFromText', () => {
  it('extracts a marker line with a local id', () => {
    const markers = extractMarkers('- **[OPEN_QUESTION]** (OQ-1) Should free-tier orgs be limited to 1 workspace?');

    expect(markers.OPEN_QUESTION).toEqual([
      { marker: 'OPEN_QUESTION', localId: 'OQ-1', text: 'Should free-tier orgs be limited to 1 workspace?' },
    ]);
  });

  it('extracts a marker line without a local id', () => {
    const markers = extractMarkers('- **[BUSINESS_RULE]** Workspace names must be unique within an organization.');

    expect(markers.BUSINESS_RULE).toEqual([
      { marker: 'BUSINESS_RULE', text: 'Workspace names must be unique within an organization.' },
    ]);
  });

  it('ignores non-marker list items', () => {
    const markers = extractMarkers('- Not a marker line.\n- [TODO] missing the bold/list-item format');
    expect(markers).toEqual({});
  });

  it('extractMarkersFromText returns the set of marker names found in a block', () => {
    const { content } = parseMarkdown(RAW);
    const openQuestions = getSectionContent(content, 'Open Questions')!;

    expect(extractMarkersFromText(openQuestions)).toEqual(['OPEN_QUESTION']);
  });
});

describe('markdownList / markdownTable', () => {
  it('renders an unordered list by default', () => {
    expect(markdownList(['a', 'b'])).toBe('- a\n- b');
  });

  it('renders an ordered list when requested', () => {
    expect(markdownList(['a', 'b'], true)).toBe('1. a\n2. b');
  });

  it('renders a markdown table with header, separator, and rows', () => {
    const table = markdownTable(['Name', 'Status'], [['STORY-001', 'backlog']]);
    const lines = table.split('\n');

    expect(lines[0]).toBe('| Name | Status |');
    expect(lines[1]).toBe('| --- | --- |');
    expect(lines[2]).toBe('| STORY-001 | backlog |');
  });
});

describe('todayString / nowString', () => {
  it('todayString returns a YYYY-MM-DD date', () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('nowString returns an ISO-like local timestamp', () => {
    expect(nowString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
