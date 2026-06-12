import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { applyDocUpdate } from './applyDocUpdate';
import { SectionEditError } from './SectionEditor';
import { parseMarkdown } from '../utils/markdownUtils';
import { MarkdownDocument } from './DocumentRepository';
import { DocumentFrontmatter } from '../domain/types';

const RAW = `---
id: STORY-001
title: Test Story
type: story
status: backlog
owner: ""
created_at: "2026-06-01"
updated_at: "2026-06-01"
tags: []
related: []
---

# Test Story

## Summary

Original summary.

## Description

Original description.
`;

function makeDoc(raw: string): MarkdownDocument {
  const { frontmatter, content } = parseMarkdown(raw);
  return {
    absPath: '/workspace/planning/stories/STORY-001-test-story.md',
    relPath: 'planning/stories/STORY-001-test-story.md',
    frontmatter: frontmatter as DocumentFrontmatter,
    body: content,
    raw,
  };
}

describe('applyDocUpdate', () => {
  it('replaces a section and bumps updated_at', () => {
    const updated = applyDocUpdate(makeDoc(RAW), { section: 'Summary', text: 'Updated summary.' });
    const { data, content } = matter(updated);

    expect(content).toContain('Updated summary.');
    expect(content).not.toContain('Original summary.');
    expect(data.updated_at).toBeTruthy();
  });

  it('appends to a section when append is set', () => {
    const updated = applyDocUpdate(makeDoc(RAW), { section: 'Summary', text: 'Extra detail.', append: true });
    const { content } = matter(updated);

    expect(content).toContain('Original summary.');
    expect(content).toContain('Extra detail.');
  });

  it('updates status', () => {
    const updated = applyDocUpdate(makeDoc(RAW), { status: 'in-progress' });
    const { data, content } = matter(updated);

    expect(data.status).toBe('in-progress');
    // Body is unchanged when only status is updated.
    expect(content).toContain('Original summary.');
  });

  it('applies both a section edit and a status change in one call', () => {
    const updated = applyDocUpdate(makeDoc(RAW), {
      section: 'Summary',
      text: 'Updated summary.',
      status: 'in-progress',
    });
    const { data, content } = matter(updated);

    expect(content).toContain('Updated summary.');
    expect(data.status).toBe('in-progress');
  });

  it('throws SectionEditError for a nonexistent section without force', () => {
    expect(() => applyDocUpdate(makeDoc(RAW), { section: 'Nonexistent', text: 'x' })).toThrow(SectionEditError);
  });

  it('leaves the document unchanged when neither section nor status is provided', () => {
    const updated = applyDocUpdate(makeDoc(RAW), {});
    const { content } = matter(updated);
    const { content: originalContent } = matter(RAW);

    expect(content).toBe(originalContent);
  });
});
