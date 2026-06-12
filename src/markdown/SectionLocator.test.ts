import { describe, it, expect } from 'vitest';
import { parseHeadings, getTopLevelHeadings, findSection } from './SectionLocator';

const DOC = `# Test Story

## Summary

Some summary text.

## Description

Line 1.
Line 2.

### Sub-detail

Nested content.

## Acceptance Criteria

- [ ] One
- [ ] Two
`;

describe('parseHeadings', () => {
  it('finds all headings with their levels and line ranges', () => {
    const headings = parseHeadings(DOC);
    expect(headings.map((h) => ({ heading: h.heading, level: h.level }))).toEqual([
      { heading: 'Test Story', level: 1 },
      { heading: 'Summary', level: 2 },
      { heading: 'Description', level: 2 },
      { heading: 'Sub-detail', level: 3 },
      { heading: 'Acceptance Criteria', level: 2 },
    ]);
  });

  it("ends a section's range at the next heading of the same or shallower level", () => {
    const headings = parseHeadings(DOC);
    const description = headings.find((h) => h.heading === 'Description')!;
    const acceptance = headings.find((h) => h.heading === 'Acceptance Criteria')!;

    // Description's range extends through its ### Sub-detail subsection,
    // stopping only at the next ## heading.
    expect(description.end).toBe(acceptance.start);
  });

  it('ends the last section at the end of the document', () => {
    const headings = parseHeadings(DOC);
    const lines = DOC.split('\n');
    const acceptance = headings.find((h) => h.heading === 'Acceptance Criteria')!;
    expect(acceptance.end).toBe(lines.length);
  });
});

describe('getTopLevelHeadings', () => {
  it('returns only level-2 headings, in document order', () => {
    expect(getTopLevelHeadings(DOC)).toEqual(['Summary', 'Description', 'Acceptance Criteria']);
  });

  it('returns an empty array when there are no ## headings', () => {
    expect(getTopLevelHeadings('# Title\n\nJust a paragraph.\n')).toEqual([]);
  });
});

describe('findSection', () => {
  it('finds a level-2 section by exact heading text', () => {
    const section = findSection(DOC, 'Description', 2);
    expect(section).not.toBeNull();
    expect(section!.heading).toBe('Description');
    expect(section!.level).toBe(2);
  });

  it('is case-insensitive', () => {
    const section = findSection(DOC, 'summary', 2);
    expect(section?.heading).toBe('Summary');
  });

  it('returns null for a heading that does not exist', () => {
    expect(findSection(DOC, 'Nonexistent', 2)).toBeNull();
  });

  it('does not match a heading at a different level', () => {
    expect(findSection(DOC, 'Sub-detail', 2)).toBeNull();
    expect(findSection(DOC, 'Sub-detail', 3)?.heading).toBe('Sub-detail');
  });
});
